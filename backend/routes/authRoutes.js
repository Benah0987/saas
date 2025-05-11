import express from 'express';
import { registerUser, loginUser } from '../controllers/authController.js';
import { authenticateUser, requireAdmin } from '../middleware/authMiddleware.js'; // Updated import

const router = express.Router();

// Public Routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected Admin Route
router.get('/admin-only', authenticateUser, requireAdmin, (req, res) => {
  res.json({ 
    success: true,
    message: 'Welcome, admin!',
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
});

export default router;