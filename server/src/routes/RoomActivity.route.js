// backend/routes/roomActivity.route.js

import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getRoomActivity,
  saveRoomActivity,
  addMessageToActivity,
  addCodeHistory,
  getRoomActivityHistory,
  getRoomCompleteActivity,
} from "../controllers/RoomActivity.controller.js";

const router = express.Router();

// Get or create activity for a specific room
router.get("/:roomId", verifyJWT, getRoomActivity);

// Save or update activity for a specific room
router.put("/:roomId", verifyJWT, saveRoomActivity);

// Add a new message to activity
router.post("/:roomId/message", verifyJWT, addMessageToActivity);

// Add a code history entry
router.post("/:roomId/code-history", verifyJWT, addCodeHistory);

// Get activity history for user
router.get("/", verifyJWT, getRoomActivityHistory);

// Get full activity (with room info) for a specific room
router.get("/:roomId/complete", verifyJWT, getRoomCompleteActivity);

export default router;
