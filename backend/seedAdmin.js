import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from './models/User.js';



mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('Failed to connect to MongoDB:', err));


const createAdmin = async () => {
  const email = 'bkimama@kemri.go.ke';
  const password = await bcrypt.hash('bkimama1234', 10);

  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists.');
    return;
  }

  const admin = new User({
    username: 'admin',
    email,
    password,
    isAdmin: true,
  });

  await admin.save();
  console.log('✅ Admin created:', admin);
};

createAdmin().then(() => mongoose.disconnect());
