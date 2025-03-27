import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
import { parseString } from "xml2js";
import excelJS from "exceljs";
import pdfParse from "pdf-parse"; // ✅ PDF text extraction
import { createWorker } from "tesseract.js"; // ✅ OCR for scanned PDFs
import File from "../models/File.js"; // ✅ MongoDB File model

// ✅ Read uploaded file content (non-PDFs)
const readFile = async (filePath) => {
  return fs.promises.readFile(filePath, "utf8");
};



if (!fs.existsSync(filePath)) {
  console.error(`❌ File not found: ${filePath}`);
  process.exit(1); // Stop execution if file is missing
}


// Now read the file
const buffer = fs.readFileSync(filePath);
console.log("✅ File loaded successfully!");



const filePath = path.join(__dirname, "uploads", "05-versions-space.pdf");

// ✅ Extract text from PDF (Text-Based)
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`❌ PDF file not found: ${filePath}`);
    }
    
    const buffer = await fs.promises.readFile(filePath);
    const data = await pdfParse(buffer);
    return data.text.trim();
  } catch (error) {
    console.error("❌ Error extracting text from PDF:", error);
    return null;
  }
};


// ✅ Extract text from Scanned PDF using OCR
const extractTextFromScannedPDF = async (filePath) => {
  try {
    console.log("🔍 Running OCR on scanned PDF...");
    const worker = await createWorker("eng"); // OCR for English
    const { data } = await worker.recognize(filePath);
    await worker.terminate();
    return data.text.trim();
  } catch (error) {
    console.error("❌ OCR failed:", error);
    return null;
  }
};

// ✅ Clean extracted data
const cleanParsedData = (data) => {
  if (!data || data.length === 0) return [];

  return data.map((entry) => {
    let cleanedEntry = {};
    for (const key in entry) {
      if (entry[key] && typeof entry[key] === "string") {
        cleanedEntry[key] = entry[key].replace(/[{}"]/g, "").trim(); // Remove unnecessary brackets and quotes
      } else {
        cleanedEntry[key] = entry[key];
      }
    }
    return cleanedEntry;
  });
};

// ✅ Function to manually parse `.ris`, `.nbib`, `.enw`
const parseCitationFile = (content) => {
  let entries = [];
  let entry = {};

  content.split("\n").forEach((line) => {
    if (line.trim() === "") {
      if (Object.keys(entry).length > 0) {
        entries.push(entry);
        entry = {};
      }
    } else {
      const [key, value] = line.split(/[-%]\s+/); // Handles `%A` (enw) and `AU -` (nbib/ris)
      if (key && value) {
        const trimmedKey = key.trim();
        const trimmedValue = value.trim();

        if (trimmedKey === "A" || trimmedKey === "AU") {
          entry.authors = entry.authors ? entry.authors + ", " + trimmedValue : trimmedValue;
        } else if (trimmedKey === "T" || trimmedKey === "TI") {
          entry.title = trimmedValue;
        } else if (trimmedKey === "J" || trimmedKey === "JO") {
          entry.journal = trimmedValue;
        } else if (trimmedKey === "D" || trimmedKey === "PY") {
          entry.year = trimmedValue;
        } else if (trimmedKey === "DO" || trimmedKey === "DOI") {
          entry.doi = trimmedValue;
        } else {
          entry[trimmedKey] = trimmedValue;
        }
      }
    }
  });

  if (Object.keys(entry).length > 0) entries.push(entry);
  return entries;
};

// ✅ Analyze file contents
const analyzeFile = async (filePath) => {
  try {
    const ext = path.extname(filePath).toLowerCase();
    let content = ext !== ".pdf" ? await readFile(filePath) : "";
    let parsedData = [];

    if (ext === ".bib" || ext === ".bibtex") {
      const parsedBib = bibtexParse.toJSON(content);
      parsedData = parsedBib.map((entry) => entry.entryTags);
    } else if ([".ris", ".nbib", ".enw"].includes(ext)) {
      parsedData = parseCitationFile(content);
    } else if (ext === ".xml") {
      parsedData = await new Promise((resolve, reject) => {
        parseString(content, (err, result) => {
          if (err) reject(err);
          else resolve(result);
        });
      });
    } else if (ext === ".pdf") {
      let extractedText = await extractTextFromPDF(filePath);

      // ✅ If no text found, try OCR
      if (!extractedText.trim()) {
        console.log("🔍 No text found in PDF, trying OCR...");
        extractedText = await extractTextFromScannedPDF(filePath);
      }

      parsedData = extractedText ? [{ content: extractedText }] : [];
    } else {
      throw new Error("Unsupported file type");
    }

    return cleanParsedData(parsedData);
  } catch (error) {
    console.error("❌ Error analyzing file:", error);
    throw new Error("Failed to analyze file");
  }
};

// ✅ Generate Excel File
const generateExcel = async (data, filePath) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Extracted Data");

  if (data.length === 0) {
    throw new Error("No data to generate Excel");
  }

  // ✅ Extract headers dynamically
  const headers = Object.keys(data[0]);

  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: 30,
  }));

  // ✅ Make headers bold
  worksheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true };
  });

  // ✅ Add data rows
  data.forEach((entry) => {
    worksheet.addRow(entry);
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

// ✅ Upload file & store metadata in MongoDB
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { originalname, path, mimetype, size } = req.file;
    const newFile = new File({
      filename: originalname,
      filepath: path,
      mimetype,
      size,
      userId: req.user.userId,
    });

    await newFile.save();
    res.status(201).json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
};

// ✅ Analyze the file & generate an Excel sheet
export const analyzeAndGenerateExcel = async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log("🔍 Analyzing File ID:", fileId);

    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ message: "File not found" });

    const analyzedData = await analyzeFile(file.filepath);
    if (!analyzedData.length) return res.status(400).json({ message: "No valid data found in file" });

    file.analyzedData = analyzedData;
    await file.save();

    const excelFileName = `${Date.now()}-citations.xlsx`;
    const excelFilePath = path.join("uploads", excelFileName);
    await generateExcel(analyzedData, excelFilePath);

    res.status(200).json({ message: "File analyzed and Excel generated", excelPath: `/uploads/${excelFileName}` });
  } catch (error) {
    res.status(500).json({ message: "Error analyzing file", error: error.message });
  }
};

// ✅ Retrieve uploaded files for a specific user
export const getUploadedFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId }).sort({ uploadedAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    console.error("❌ Error retrieving files:", error);
    res.status(500).json({ message: "Error retrieving files", error: error.message });
  }
};

