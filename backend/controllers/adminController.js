import User from '../models/User.js';
import File from '../models/File.js';

// Get all registered users (without passwords)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({})
      .select('-password -__v')
      .lean();
    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users',
      error: error.message 
    });
  }
};

// Promote user to admin
export const promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { $set: { isAdmin: true } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `User ${user.email} promoted to admin`,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Promotion failed',
      error: error.message
    });
  }
};

// Get all files with user details
export const getAllFiles = async (req, res) => {
  try {
    const files = await File.find({})
      .populate('userId', 'username email')
      .select('-__v')
      .lean();

    res.json({
      success: true,
      count: files.length,
      files
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch files',
      error: error.message
    });
  }
};