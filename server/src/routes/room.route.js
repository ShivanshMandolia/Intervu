import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createRoom,
  joinRoom,
  endRoom,
  getMyRooms,
} from "../controllers/room.controller.js";

const router = express.Router();

// ✅ Create a new room
router.post("/create", verifyJWT, createRoom);

// ✅ Join a room by roomId
router.post("/join/:roomId", verifyJWT, joinRoom);

// ✅ End a room (only creator allowed)
router.post("/end/:roomId", verifyJWT, endRoom);

// ✅ Get all rooms user has created or joined
router.get("/my-rooms", verifyJWT, getMyRooms);

export default router;
