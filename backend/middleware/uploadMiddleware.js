import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Ensure the folder exists
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// ✅ Allow ALL file types (No restriction)
const fileFilter = (req, file, cb) => {
    cb(null, true); // Accept all files
};

export const upload = multer({ storage, fileFilter });
