import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 🔹 Register a new user
export const registerUser = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        console.log("📥 Incoming Registration Request:", req.body);

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("❌ Email already in use");
            return res.status(400).json({ message: "Email already in use" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = new User({ username, email, password: hashedPassword });
        await newUser.save();

        console.log("✅ User Registered Successfully:", newUser);
        res.status(201).json({ message: "Signup successful", user: newUser });
    } catch (error) {
        console.error("🔥 Registration Error:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

// 🔑 Login a user
// 🔑 Login a user
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("📥 Login Request Received:", req.body);

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            console.log("❌ User not found");
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log("❌ Incorrect password");
            return res.status(401).json({ message: "Invalid email or password" });
        }

        // ✅ Include isAdmin in the token
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                isAdmin: user.isAdmin,
            },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        console.log("✅ Login Successful, Token Generated:", token);

        // Respond without sending password
        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                isAdmin: user.isAdmin,
            },
        });
    } catch (error) {
        console.error("🔥 Login Error:", error);
        res.status(500).json({ message: "Internal Server Error", error });
    }
};

