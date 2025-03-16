import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import fileRoutes from './routes/fileRoutes.js';
import authRoutes from './routes/authRoutes.js';

dotenv.config();
const app = express();

// ✅ Improved CORS Configuration
app.use(cors({ origin: '*', credentials: true }));

// ✅ Middleware
app.use(express.json());

// ✅ Base Route (Fix for 404 Errors)
app.get("/", (req, res) => {
    res.json({ message: "Welcome to the SaaS API!" });
});

// ✅ API Routes
app.use('/api/files', fileRoutes);
app.use('/api/auth', authRoutes);

// ✅ MongoDB Connection with Retry Mechanism
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Failed:", error.message);
        setTimeout(connectDB, 5000); // Retry after 5 seconds
    }
};
connectDB();

// ✅ Start Server on Available Port
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// ✅ Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Promise Rejection:", err.message);
    server.close(() => process.exit(1));
});

// ✅ Graceful Shutdown (CTRL+C or System Kill)
process.on("SIGINT", () => {
    console.log("🛑 Shutting down gracefully...");
    mongoose.connection.close(() => {
        console.log("MongoDB Disconnected");
        process.exit(0);
    });
});
