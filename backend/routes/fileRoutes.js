import express from 'express';
import { uploadFile } from '../controllers/fileController.js';
import { authenticateUser } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Protected file upload route (user must be logged in)
router.post('/upload', authenticateUser, upload.single('file'), uploadFile);

export default router;
