import fs from 'fs';
import path from 'path';
import bibtexParse from 'bibtex-parse-js';
import risParser from 'ris'; // Install: npm install ris
import { parseString } from 'xml2js'; // Install: npm install xml2js
import excelJS from 'exceljs';

// Function to read uploaded files
const readFile = async (filePath) => {
    return fs.promises.readFile(filePath, 'utf8');
};

// Function to analyze the file content
const analyzeFile = async (filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const content = await readFile(filePath);

    if (ext === '.bib' || ext === '.bibtex') {
        return bibtexParse.toJSON(content);
    } else if (ext === '.ris') {
        return risParser.parse(content);
    } else if (ext === '.nbib' || ext === '.xml') {
        return new Promise((resolve, reject) => {
            parseString(content, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    } else if (ext === '.txt' || ext === '.enw') {
        return content.split('\n'); // Simple text parsing
    }
    return { message: 'Unsupported file type' };
};

// Function to generate Excel from analyzed data
const generateExcel = async (data, filePath) => {
    const workbook = new excelJS.Workbook();
    const worksheet = workbook.addWorksheet('Citations');

    worksheet.columns = [
        { header: 'Title', key: 'title', width: 40 },
        { header: 'Author', key: 'author', width: 30 },
        { header: 'Year', key: 'year', width: 10 },
        { header: 'Source', key: 'source', width: 30 }
    ];

    data.forEach(entry => {
        worksheet.addRow({
            title: entry.title || 'Unknown',
            author: entry.author || 'Unknown',
            year: entry.year || 'N/A',
            source: entry.source || 'N/A'
        });
    });

    await workbook.xlsx.writeFile(filePath);
    return filePath;
};

// API Endpoint to handle file upload and analysis
export const uploadFile = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

        const filePath = req.file.path;
        const analyzedData = await analyzeFile(filePath);

        // Save the extracted data as an Excel file
        const excelFilePath = `uploads/${Date.now()}-citations.xlsx`;
        await generateExcel(analyzedData, excelFilePath);

        res.status(200).json({ message: 'File analyzed successfully', excelPath: excelFilePath });
    } catch (error) {
        res.status(500).json({ message: 'Error processing file', error });
    }
};
