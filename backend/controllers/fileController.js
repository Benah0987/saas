import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
import { parseString } from "xml2js";
import excelJS from "exceljs";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import File from "../models/File.js";
// import pdfImgConvert from "pdf-img-convert";
import { exec } from 'child_process';

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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';


// OCR scanned PDF
import { promisify } from 'util';
const execPromise = promisify(exec);

const extractTextFromScannedPDF = async (filePath) => {
  try {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const outputBasePath = path.join(__dirname, 'temp_image'); // no extension yet

    // Convert first page of PDF to PNG
    const command = `pdftoppm -png -f 1 -l 1 "${filePath}" "${outputBasePath}"`;
    await execPromise(command);

    // Because pdftoppm creates temp_image-1.png
    const generatedImagePath = `${outputBasePath}-1.png`;

    if (!fs.existsSync(generatedImagePath)) {
      throw new Error("Converted image not found");
    }

    console.log(`✅ Image generated: ${generatedImagePath}`);

    // Perform OCR on the generated image
    const text = await performOCR(generatedImagePath);
    return text;
  } catch (error) {
    console.error('❌ OCR process failed:', error);
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
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) {
      if (Object.keys(entry).length) {
        entries.push(entry);
        entry = {};
      }
      continue;
    }

    // Match RIS tags (e.g., %A, %T) with flexible spacing
    const match = line.match(/^%([A-Z0-9]+)\s+(.*)/);
    if (match) {
      const [, key, value] = match;
      switch(key) {
        case "A":
        case "AU":
          entry.authors = entry.authors ? `${entry.authors}, ${value}` : value;
          break;
        case "T":
        case "TI":
          entry.title = value;
          break;
        case "J":
        case "JO":
          entry.journal = value;
          break;
        case "D":
        case "PY":
          entry.year = value;
          break;
        case "DO":
        case "DOI":
          entry.doi = value;
          break;
        case "V":
          entry.volume = value;
          break;
        case "N":
          entry.issue = value;
          break;
        case "P":
          entry.pages = value;
          break;
        case "U":
          entry.url = value;
          break;
        case "X":
          entry.abstract = value;
          break;
        default:
          entry[key] = value;  // Handle any additional keys that might exist
          break;
      }
    }
  }

  // Add the last entry if there are any
  if (Object.keys(entry).length) {
    entries.push(entry);
  }

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
      // First attempt to extract text from the PDF
      let text = await extractTextFromPDF(filePath);
      
      // If no text found, attempt OCR
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

