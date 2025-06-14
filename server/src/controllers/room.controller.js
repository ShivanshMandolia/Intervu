import { Room } from "../models/Room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { nanoid } from "nanoid";

// Create Room
const createRoom = asyncHandler(async (req, res) => {
  const { type = "practice" } = req.body;
  const userId = req.user._id;

  const newRoom = await Room.create({
    roomId: nanoid(10),
    createdBy: userId,
    participants: [userId],
    type,
  });

  return res.status(201).json(
    new ApiResponse(201, newRoom, "Room created successfully")
  );
});

// Join Room
const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  const alreadyJoined = room.participants.includes(userId);
  if (!alreadyJoined) {
    room.participants.push(userId);
    await room.save();
  }

  return res.status(200).json(
    new ApiResponse(200, room, "Joined room successfully")
  );
});

// End Room
const endRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  if (!room.createdBy.equals(userId)) {
    throw new ApiError(403, "Only the room creator can end the room");
  }

  room.endedAt = new Date();
  await room.save();

  return res.status(200).json(
    new ApiResponse(200, room, "Room ended successfully")
  );
});

// Get My Rooms (created or joined)
const getMyRooms = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const rooms = await Room.find({
    $or: [
      { createdBy: userId },
      { participants: userId }
    ]
  })
    .sort({ createdAt: -1 })
    .populate("createdBy", "fullName username")
    .populate("participants", "fullName username");

  return res.status(200).json(
    new ApiResponse(200, rooms, "Fetched your rooms")
  );
});

export {
  createRoom,
  joinRoom,
  endRoom,
  getMyRooms,
};
