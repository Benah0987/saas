import risParser from '../node_modules/ris/src/index.js';
import fs from "fs";
import path from "path";
import bibtexParse from "bibtex-parse-js";
// import ris from "ris"; // ✅ Corrected import
import { parseString } from "xml2js";
import excelJS from "exceljs";
import File from "../models/File.js"; // ✅ Use the existing File.js model

// ✅ Read uploaded file content
const readFile = async (filePath) => {
  return fs.promises.readFile(filePath, "utf8");
};

// ✅ Analyze file contents
const analyzeFile = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  const content = await readFile(filePath);
  let parsedData = [];

  if (ext === ".bib" || ext === ".bibtex") {
    const parsedBib = bibtexParse.toJSON(content);
    parsedData = parsedBib.map((entry) => entry.entryTags);
  } else if (ext === ".ris") {
    parsedData = ris.parse(content);
  } else if (ext === ".nbib" || ext === ".xml") {
    parsedData = await new Promise((resolve, reject) => {
      parseString(content, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
  } else if (ext === ".txt" || ext === ".enw") {
    parsedData = content.split("\n");
  } else {
    return { message: "Unsupported file type" };
  }

  return parsedData;
};

// ✅ Generate Excel File Dynamically
const generateExcel = async (data, filePath) => {
  const workbook = new excelJS.Workbook();
  const worksheet = workbook.addWorksheet("Citations");

  if (data.length === 0) {
    return { message: "No data to generate Excel" };
  }

  // ✅ Extract headers dynamically
  const headers = Object.keys(data[0]);
  worksheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: 30,
  }));

  // ✅ Add data rows
  data.forEach((entry) => {
    worksheet.addRow(entry);
  });

  await workbook.xlsx.writeFile(filePath);
  return filePath;
};

// ✅ Upload file & store metadata in MongoDB (User-Specific)
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const { originalname, path, mimetype, size } = req.file;
    const newFile = new File({
      filename: originalname,
      filepath: path,
      mimetype,
      size,
      userId: req.user.userId, // ✅ Ensure user ownership
    });

    await newFile.save();
    res.status(201).json({ message: "File uploaded successfully", file: newFile });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error });
  }
};

// ✅ Retrieve uploaded files for a specific user
export const getUploadedFiles = async (req, res) => {
  try {
    const files = await File.find({ userId: req.user.userId }).sort({ uploadedAt: -1 });
    res.status(200).json(files);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving files", error });
  }
};

// ✅ Analyze the file & generate an Excel sheet
export const analyzeAndGenerateExcel = async (req, res) => {
  try {
    const { fileId } = req.params;
    console.log("🔍 Analyzing File ID:", fileId);

    const file = await File.findById(fileId);
    if (!file) {
      console.log("❌ File not found in database!");
      return res.status(404).json({ message: "File not found" });
    }

    console.log("📂 File Path:", file.filepath);

    const analyzedData = await analyzeFile(file.filepath);
    if (!analyzedData || analyzedData.length === 0) {
      console.log("❌ No valid data found in file!");
      return res.status(400).json({ message: "No valid data found in file" });
    }

    // ✅ Store analyzed data in MongoDB
    file.analyzedData = analyzedData;
    await file.save();
    console.log("✅ Analyzed data saved to database.");

    // ✅ Generate an Excel file
    const excelFilePath = `uploads/${Date.now()}-citations.xlsx`;
    await generateExcel(analyzedData, excelFilePath);
    console.log("📁 Excel file generated:", excelFilePath);

    res.status(200).json({
      message: "File analyzed and Excel generated",
      excelPath: excelFilePath,
    });
  } catch (error) {
    console.error("❌ Analysis Error:", error);
    res.status(500).json({ message: "Error analyzing file", error: error.message });
  }
};

