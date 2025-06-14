import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getCurrentUser,
  updateUserProfile,
  deleteUserAccount
} from "../controllers/user.controller.js";

const router = express.Router();

// ✅ Get current user profile
router.get("/profile", verifyJWT, getCurrentUser);

// ✅ Update user profile (with optional avatar)
router.put("/profile", verifyJWT, updateUserProfile);

// ✅ Delete user account
router.delete("/delete", verifyJWT, deleteUserAccount);

export default router;
