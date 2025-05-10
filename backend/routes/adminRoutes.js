// routes/adminRoutes.js
import express from 'express';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const router = express.Router();

router.post('/create-admin', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
