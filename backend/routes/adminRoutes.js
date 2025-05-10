import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

// POST /create-admin route
router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new admin user
    const newAdmin = new User({
      username,
      email,
      password: hashedPassword,
      isAdmin: true,
    });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin created successfully!' });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error', error });
  }
});

export default router;
