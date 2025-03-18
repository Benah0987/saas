import express from 'express';
import { uploadFile } from '../controllers/fileController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Upload and analyze files (Protected Route)
router.post('/upload', authenticateUser, upload.single('file'), uploadFile);

export default router;
