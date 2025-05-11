import express from 'express';
import {
  getAllUsers,
  promoteToAdmin,
  getAllFiles
} from '../controllers/adminController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authentication and admin check to all routes
router.use(authenticateUser, requireAdmin);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:userId/promote', promoteToAdmin);

// File management
router.get('/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password"); // exclude password
    res.json(users);
  } catch (err) {
    console.error("🔥 Error fetching users:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default router;