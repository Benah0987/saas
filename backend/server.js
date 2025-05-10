import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path"; // Import for serving static files
import fileRoutes from "./routes/fileRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js"; // Import the admin routes

dotenv.config();
const app = express();

// Improved CORS Configuration
app.use(cors({ origin: "*", credentials: true }));

// Middleware to handle JSON data
app.use(express.json());

// Serve Static Files (Fix for Download Issue)
app.use("/uploads", express.static(path.join(path.resolve(), "uploads"))); // Now accessible via http://localhost:5000/uploads/filename.xlsx

// Base Route (Fix for 404 Errors)
app.get("/", (req, res) => {
  res.json({ message: "Welcome to the SaaS API!" });
});

// API Routes
app.use("/api/files", fileRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes); // Add the admin route here

// MongoDB Connection with Retry Mechanism
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed:", error.message);
    setTimeout(connectDB, 5000); // Retry after 5 seconds
  }
};
connectDB();

// Start Server on Available Port
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Handle Unhandled Promise Rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Promise Rejection:", err.message);
  server.close(() => process.exit(1));
});

// Graceful Shutdown (CTRL+C or System Kill)
process.on("SIGINT", () => {
  console.log("🛑 Shutting down gracefully...");
  mongoose.connection.close(() => {
    console.log("MongoDB Disconnected");
    process.exit(0);
  });
});
