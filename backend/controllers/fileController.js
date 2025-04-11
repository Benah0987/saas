import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
import { parseString } from "xml2js";
import excelJS from "exceljs";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import File from "../models/File.js";
// const pdfImgConvert = await import("pdf-img-convert");


// ========================
// SECTION CONFIGURATION
// ========================
const SECTION_HEADINGS = {
  contact: /^(contact information|contact details|personal information|phone|email|address)$/i,
  summary: /^(summary|professional summary|profile|about me)$/i,
  experience: /^(work experience|employment history|experience|professional experience)$/i,
  skills: /^(skills|technical skills|key skills|competencies)$/i,
  education: /^(education|academic background|qualifications)$/i,
  projects: /^(projects|key projects|selected projects)$/i,
  certifications: /^(certifications|licenses|certificate)$/i,
  awards: /^(awards|honors|achievements|recognitions)$/i,
  languages: /^(languages|language proficiency)$/i,
  volunteer: /^(volunteer work|volunteering)$/i,
};

// ========================
// FILE PROCESSING CORE
// ========================

// Config for image conversion
const pdf2imageOptions = {
  density: 300,
  saveFilename: "page",
  savePath: "./temp",
  format: "png",
  width: 2000,
  height: 2000
};

// Read non-PDF file
const readFile = async (filePath) => fs.promises.readFile(filePath, "utf8");

// Extract text from a normal PDF
const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("❌ Error extracting text from PDF:", error);
    return null;
  }
};

// OCR scanned PDF
const extractTextFromScannedPDF = async (filePath) => {
  try {
    const images = await pdfImgConvert.convert(filePath, {
      width: 2000,
      height: 2000,
      base64: false
    });
    
    if (!images.length) throw new Error("❌ No images generated from PDF");

    // Save first page temporarily
    const imagePath = "./temp/ocr_page.png";
    fs.writeFileSync(imagePath, images[0]);

    console.log(`✅ OCR Image: ${imagePath}`);

    // Perform OCR
    const worker = await createWorker("eng");
    const { data: { text } } = await worker.recognize(imagePath);
    await worker.terminate();

    fs.unlinkSync(imagePath); // Clean up
    return text.trim();
  } catch (error) {
    console.error("❌ OCR failed:", error);
    return null;
  }
};

// ========================
// RESUME PARSING LOGIC
// ========================

/**
 * Parses raw text into structured resume sections
 */
function parseResumeSections(rawText) {
  const lines = rawText.split('\n').filter(line => line.trim());
  const sections = {};
  let currentSection = null;

  for (const line of lines) {
    // Check for section headings
    let isHeading = false;
    for (const [sectionName, regex] of Object.entries(SECTION_HEADINGS)) {
      if (regex.test(line)) {
        currentSection = sectionName;
        sections[currentSection] = [];
        isHeading = true;
        break;
      }
    }

    // Add content to current section
    if (!isHeading && currentSection) {
      sections[currentSection].push(line.trim());
    }
  }

  return sections;
}

/**
 * Cleans and formats parsed sections
 */
function formatResumeSections(rawSections) {
  const formatted = {};

  // Special handling for experience (split by dates)
  if (rawSections.experience) {
    formatted.experience = rawSections.experience.join('\n')
      .split(/(?=\d{4} - \d{4}|Present|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)
      .filter(entry => entry.trim());
  }

  // Format skills list
  if (rawSections.skills) {
    formatted.skills = rawSections.skills.join(' ')
      .split(/[,•·]|\n/)
      .map(skill => skill.trim())
      .filter(Boolean);
  }

  // Format education (degree-focused)
  if (rawSections.education) {
    formatted.education = rawSections.education.join('\n')
      .split(/(?=\b(B\.|Bachelor|M\.|Master|Ph\.D|Diploma)\b)/i)
      .filter(entry => entry.trim());
  }

  // Other sections (keep as-is)
  Object.keys(rawSections).forEach(section => {
    if (!formatted[section]) {
      formatted[section] = rawSections[section].join('\n');
    }
  });

  return formatted;
}

// ========================
// CITATION & GENERAL FILE PROCESSING
// ========================

// Clean parsed citation data
const cleanParsedData = (data) => {
  return data.map(entry => {
    let cleaned = {};
    for (const key in entry) {
      const value = entry[key];
      cleaned[key] = typeof value === "string"
        ? value.replace(/[{}"]/g, "").trim()
        : value;
    }
    return cleaned;
  });
};

// Parse .ris, .nbib, .enw files
const parseCitationFile = (content) => {
  let entries = [], entry = {};
  content.split("\n").forEach(line => {
    if (!line.trim()) {
      if (Object.keys(entry).length) {
        entries.push(entry);
        entry = {};
      }
    } else {
      const [key, value] = line.split(/[-%]\s+/);
      if (key && value) {
        const k = key.trim(), v = value.trim();
        if (["A", "AU"].includes(k)) entry.authors = entry.authors ? entry.authors + ", " + v : v;
        else if (["T", "TI"].includes(k)) entry.title = v;
        else if (["J", "JO"].includes(k)) entry.journal = v;
        else if (["D", "PY"].includes(k)) entry.year = v;
        else if (["DO", "DOI"].includes(k)) entry.doi = v;
        else entry[k] = v;
      }
    }
  });
  if (Object.keys(entry).length) entries.push(entry);
  return entries;
};

// ========================
// MAIN FILE ANALYSIS
// ========================

const analyzeFile = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let content = ext !== ".pdf" ? await readFile(filePath) : "";
    let parsedData = [];

    if ([".bib", ".bibtex"].includes(ext)) {
      const parsedBib = bibtexParse.toJSON(content);
      parsedData = parsedBib.map(entry => entry.entryTags);
    } else if ([".ris", ".nbib", ".enw"].includes(ext)) {
      parsedData = parseCitationFile(content);
    } else if (ext === ".xml") {
      parsedData = await new Promise((resolve, reject) => {
        parseString(content, (err, result) => err ? reject(err) : resolve(result));
      });
    } else if (ext === ".pdf") {
      let text = await extractTextFromPDF(filePath);
      
      // If no text found, try OCR
      if (!text?.trim()) {
        console.log("🔍 No text found, attempting OCR...");
        text = await extractTextFromScannedPDF(filePath);
      }

      // For resumes, parse into structured sections
      if (text) {
        const rawSections = parseResumeSections(text);
        parsedData = [formatResumeSections(rawSections)];
      } else {
        parsedData = [];
      }
    } else {
      throw new Error("Unsupported file type");
    }

    return cleanParsedData(parsedData);
  } catch (error) {
    console.error("❌ File analysis failed:", error);
    throw new Error("Failed to analyze file");
  }
};

// ========================
// EXCEL GENERATION
// ========================

const generateExcel = async (data, filePath) => {
  if (!data.length) throw new Error("No data to generate Excel");

  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracted Data");

  // Handle both resume and citation data formats
  if (data[0].content || data[0].section) {
    // Resume-style structured data
    worksheet.columns = [
      { header: 'Section', key: 'section', width: 20 },
      { header: 'Content', key: 'content', width: 80 }
    ];

    data.forEach(item => {
      if (Array.isArray(item.content)) {
        item.content.forEach(contentItem => {
          worksheet.addRow({ section: item.section, content: contentItem });
        });
      } else {
        worksheet.addRow(item);
      }
    });
  } else {
    // Citation-style data
    worksheet.columns = Object.keys(data[0]).map(header => ({
      header,
      key: header,
      width: 30
    }));

    data.forEach(entry => {
      worksheet.addRow(entry);
    });
  }

  // Style headers
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

// ========================
// CONTROLLER FUNCTIONS
// ========================

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { originalname, path: filepath, mimetype, size } = req.file;
    const file = new File({
      filename: originalname,
      filepath,
      mimetype,
      size,
      userId: req.user.userId
    });

    await file.save();
    res.status(201).json({ message: "File uploaded successfully", file });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
};

export const analyzeAndGenerateExcel = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const analyzedData = await analyzeFile(file.filepath);
    if (!analyzedData.length) return res.status(400).json({ message: "No valid data found" });

    file.analyzedData = analyzedData;
    await file.save();

    const excelFileName = `${Date.now()}-extracted.xlsx`;
    const excelFilePath = path.join("uploads", excelFileName);
    await generateExcel(analyzedData, excelFilePath);

    res.status(200).json({ 
      message: "Excel generated successfully",
      excelPath: `/uploads/${excelFileName}`,
      structuredData: analyzedData 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Failed to analyze or export file", 
      error: error.message 
    });
  }
};

export const getUploadedFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId }).sort({ uploadedAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve files", error: error.message });
  }
};