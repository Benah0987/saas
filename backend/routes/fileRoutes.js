import express from "express";
import {
  uploadFile,
  getUploadedFiles,
  analyzeAndGenerateExcel,
  getAllFiles, // ⬅️ Import the new controller
} from "../controllers/fileController.js";

import { authenticateUser, requireAdmin } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// ✅ Upload file (Protected)
router.post("/upload", authenticateUser, upload.single("file"), uploadFile);

// ✅ Get files uploaded by the authenticated user
router.get("/", authenticateUser, getUploadedFiles);
// Protected admin route

router.get('/all', 
  authenticateUser,    // First verify authentication
  requireAdmin,        // Then verify admin status
  getAllFiles          // Finally handle the request
);

// ✅ Analyze & Generate Excel
router.post("/analyze/:fileId", authenticateUser, analyzeAndGenerateExcel);

export default router;
