import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // ✅ Ensure the folder exists
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

// ✅ Allow all citation-related file types
const allowedExtensions = [".bib", ".ris", ".nbib", ".enw", ".txt", ".xml", ".csv", ".docx", ".pdf"];

const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Please upload citation files."), false);
  }
};

export const upload = multer({ storage, fileFilter });
