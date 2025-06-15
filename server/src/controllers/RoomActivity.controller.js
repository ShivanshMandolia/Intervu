// backend/controllers/roomActivity.controller.js
import { RoomActivity } from "../models/RoomActivity.model.js";
import { Room } from "../models/Room.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get or create room activity
const getRoomActivity = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  // Find the room first
  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  // Check if user is participant
  const isParticipant = room.participants.includes(userId) || 
                       room.createdBy.equals(userId);
  if (!isParticipant) {
    throw new ApiError(403, "Access denied. You are not a participant of this room.");
  }

  // Get or create room activity
  let activity = await RoomActivity.findOne({ room: room._id })
    .populate('messages.sender', 'fullName username')
    .populate('codeHistory.updatedBy', 'fullName username');

  if (!activity) {
    activity = await RoomActivity.create({
      room: room._id,
      codeSnapshot: '',
      language: 'cpp',
      messages: [],
      codeHistory: [],
      callLogs: []
    });
  }

  return res.status(200).json(
    new ApiResponse(200, activity, "Room activity retrieved successfully")
  );
});

// Save/Update room activity
const saveRoomActivity = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const {
    codeSnapshot,
    language,
    messages,
    codeHistory,
    callLogs,
    recordingURL,
    recordingDuration
  } = req.body;

  // Find the room first
  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  // Check if user is participant
  const isParticipant = room.participants.includes(userId) || 
                       room.createdBy.equals(userId);
  if (!isParticipant) {
    throw new ApiError(403, "Access denied. You are not a participant of this room.");
  }

  // Update or create activity
  const activity = await RoomActivity.findOneAndUpdate(
    { room: room._id },
    {
      codeSnapshot: codeSnapshot || '',
      language: language || 'cpp',
      recordingURL,
      recordingDuration,
      updatedAt: new Date(),
      ...(messages && { $push: { messages: { $each: messages } } }),
      ...(codeHistory && { $push: { codeHistory: { $each: codeHistory } } }),
      ...(callLogs && { $push: { callLogs: { $each: callLogs } } })
    },
    { 
      new: true, 
      upsert: true,
      populate: [
        { path: 'messages.sender', select: 'fullName username' },
        { path: 'codeHistory.updatedBy', select: 'fullName username' }
      ]
    }
  );

  return res.status(200).json(
    new ApiResponse(200, activity, "Room activity saved successfully")
  );
});

// Add message to room activity
const addMessageToActivity = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { content, type = 'text' } = req.body;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  const activity = await RoomActivity.findOneAndUpdate(
    { room: room._id },
    {
      $push: {
        messages: {
          sender: userId,
          content,
          type,
          timestamp: new Date()
        }
      }
    },
    { new: true, upsert: true }
  ).populate('messages.sender', 'fullName username');

  return res.status(200).json(
    new ApiResponse(200, activity.messages.slice(-1)[0], "Message added successfully")
  );
});

// Add code history entry
const addCodeHistory = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;
  const { code, language } = req.body;

  const room = await Room.findOne({ roomId });
  if (!room) throw new ApiError(404, "Room not found");

  const activity = await RoomActivity.findOneAndUpdate(
    { room: room._id },
    {
      codeSnapshot: code,
      language,
      $push: {
        codeHistory: {
          code,
          language,
          updatedBy: userId,
          timestamp: new Date()
        }
      }
    },
    { new: true, upsert: true }
  );

  return res.status(200).json(
    new ApiResponse(200, activity, "Code history updated successfully")
  );
});

// Get room activity history (for past meetings)
const getRoomActivityHistory = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 10 } = req.query;

  // Find all rooms user participated in
  const userRooms = await Room.find({
    $or: [
      { createdBy: userId },
      { participants: userId }
    ]
  }).select('_id');

  const roomIds = userRooms.map(room => room._id);

  // Get activities for these rooms
  const activities = await RoomActivity.find({
    room: { $in: roomIds }
  })
    .populate({
      path: 'room',
      select: 'roomId name type createdAt endedAt createdBy',
      populate: {
        path: 'createdBy',
        select: 'fullName username'
      }
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const total = await RoomActivity.countDocuments({
    room: { $in: roomIds }
  });

  return res.status(200).json(
    new ApiResponse(200, {
      activities,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    }, "Activity history retrieved successfully")
  );
});

// Get specific room's complete activity
const getRoomCompleteActivity = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const userId = req.user._id;

  const room = await Room.findOne({ roomId })
    .populate('createdBy', 'fullName username')
    .populate('participants', 'fullName username');

  if (!room) throw new ApiError(404, "Room not found");

  // Check if user has access
  const hasAccess = room.participants.some(p => p._id.equals(userId)) || 
                   room.createdBy._id.equals(userId);
  if (!hasAccess) {
    throw new ApiError(403, "Access denied");
  }

  const activity = await RoomActivity.findOne({ room: room._id })
    .populate('messages.sender', 'fullName username')
    .populate('codeHistory.updatedBy', 'fullName username');

  return res.status(200).json(
    new ApiResponse(200, {
      room,
      activity
    }, "Complete room activity retrieved successfully")
  );
});

export {
  getRoomActivity,
  saveRoomActivity,
  addMessageToActivity,
  addCodeHistory,
  getRoomActivityHistory,
  getRoomCompleteActivity
};