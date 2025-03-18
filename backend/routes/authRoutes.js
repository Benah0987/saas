import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";

const router = express.Router();

// 📝 Register Route (Calls Controller)
router.post("/register", registerUser);

// 🔑 Login Route (Calls Controller)
router.post("/login", loginUser);

export default router;
