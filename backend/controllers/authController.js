import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const register = async (req, res) => {
    try {
        console.log("🟡 Incoming Registration Request:", req.body);

        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if email is already in use
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, email, password: hashedPassword });

        console.log("🟢 Saving User:", user);
        await user.save();

        console.log("✅ User Registered Successfully");
        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        console.error("❌ Error Registering User:", error);
        res.status(500).json({ message: "Error registering user", error });
    }
};

export const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;

        if (!password || (!email && !username)) {
            return res.status(400).json({ message: "Email or Username and password required" });
        }

        const user = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.json({ token, user: { username: user.username, email: user.email } });
    } catch (error) {
        console.error("❌ Error Logging In:", error);
        res.status(500).json({ message: "Error logging in", error });
    }
};


