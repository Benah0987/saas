import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
  try {
    // 1. Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }
    const token = authHeader.split(' ')[1];

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Verify user exists
    const user = await User.findById(decoded.userId);
    if (!user) throw new Error('User not found');

    // 4. Attach to request
    req.user = {
      _id: user._id,
      email: user.email,
      isAdmin: user.isAdmin
    };

    next();
  } catch (error) {
    console.error('Auth Error:', error.message);
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      error: error.message,
      solution: 'Check your JWT_SECRET and token expiration'
    });
  }
};
export const requireAdmin = (req, res, next) => {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ 
      success: false,
      message: 'Admin privileges required' 
    });
  }
  next();
};