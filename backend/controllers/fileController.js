import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
import { parseString } from "xml2js";
import excelJS from "exceljs";
import pdfParse from "pdf-parse";
import { createWorker } from "tesseract.js";
import File from "../models/File.js";
import pdf2image from "pdf2image";

// ✅ Config for image conversion
const pdf2imageOptions = {
  density: 300,
  saveFilename: "page",
  savePath: "./temp",
  format: "png",
  width: 2000,
  height: 2000
};

// ✅ Read non-PDF file
const readFile = async (filePath) => fs.promises.readFile(filePath, "utf8");

// ✅ Extract text from a normal PDF
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

// ✅ OCR scanned PDF
const extractTextFromScannedPDF = async (filePath) => {
  try {
    const images = await pdf2image.convert(filePath, pdf2imageOptions);
    if (!images.length) throw new Error("❌ No images generated from PDF");

    const imagePath = images[0].path;
    console.log(`✅ OCR Image: ${imagePath}`);

    const { data: { text } } = await createWorker("eng").then(async (worker) => {
      const result = await worker.recognize(imagePath);
      await worker.terminate();
      return result;
    });

    fs.unlinkSync(imagePath); // Clean up
    return text.trim();
  } catch (error) {
    console.error("❌ OCR failed:", error);
    return null;
  }
};

// ✅ Clean parsed citation data
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

// ✅ Parse .ris, .nbib, .enw files
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

// ✅ Main file analysis logic
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
      if (!text.trim()) {
        console.log("🔍 No text found, attempting OCR...");
        text = await extractTextFromScannedPDF(filePath);
      }
      parsedData = text ? [{ content: text }] : [];
    } else {
      throw new Error("Unsupported file type");
    }

    return cleanParsedData(parsedData);
  } catch (error) {
    console.error("❌ File analysis failed:", error);
    throw new Error("Failed to analyze file");
  }
};

// ✅ Excel generation
const generateExcel = async (data, filePath) => {
  if (!data.length) throw new Error("No data to generate Excel");

  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracted Data");

  worksheet.columns = Object.keys(data[0]).map(header => ({
    header,
    key: header,
    width: 30
  }));

  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true };
  });

  data.forEach(entry => {
    worksheet.addRow(entry);
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

// ✅ Upload and save file metadata
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

// ✅ Analyze uploaded file and export to Excel
export const analyzeAndGenerateExcel = async (req, res) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const analyzedData = await analyzeFile(file.filepath);
    if (!analyzedData.length) return res.status(400).json({ message: "No valid data found" });

    file.analyzedData = analyzedData;
    await file.save();

    const excelFileName = `${Date.now()}-citations.xlsx`;
    const excelFilePath = path.join("uploads", excelFileName);
    await generateExcel(analyzedData, excelFilePath);

    res.status(200).json({ message: "Excel generated", excelPath: `/uploads/${excelFileName}` });
  } catch (error) {
    res.status(500).json({ message: "Failed to analyze or export file", error: error.message });
  }
};

// ✅ Get user-uploaded files
export const getUploadedFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId }).sort({ uploadedAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Failed to retrieve files", error: error.message });
  }
};
