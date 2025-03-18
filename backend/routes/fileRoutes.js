import express from "express";
import { uploadFile, getUploadedFiles, analyzeAndGenerateExcel } from "../controllers/fileController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ✅ Upload file (Protected)
router.post("/upload", authenticateUser, upload.single("file"), uploadFile);

// ✅ Get user-specific uploaded files
router.get("/", authenticateUser, getUploadedFiles);

// ✅ Analyze & Generate Excel
router.post("/analyze/:fileId", authenticateUser, analyzeAndGenerateExcel);

export default router;
