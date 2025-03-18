import multer from 'multer';
import path from 'path';

// Define allowed extensions
const allowedExtensions = ['.bib', '.ris', '.nbib', '.enw', '.bibtex', '.txt'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure the folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const fileFilter = (req, file, cb) => {
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only citation files (.bib, .ris, .nbib, .enw, .bibtex, .txt) are allowed'), false);
    }
};

export const upload = multer({ storage, fileFilter });
