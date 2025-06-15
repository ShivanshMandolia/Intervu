// backend/models/RoomActivity.model.js - Enhanced version
import mongoose, { Schema } from "mongoose";

const roomActivitySchema = new Schema(
  {
    room: {
      type: Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    codeSnapshot: {
      type: String,
      default: "",
    },
    language: {
      type: String,
      default: "cpp",
    },
    recordingURL: {
      type: String,
    },
    recordingDuration: {
      type: Number, // in seconds
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        timestamp: { type: Date, default: Date.now },
        type: { type: String, enum: ["text", "system"], default: "text" }
      }
    ],
    codeHistory: [
      {
        code: String,
        language: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
      }
    ],
    callLogs: [
      {
        startTime: Date,
        endTime: Date,
        participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
        duration: Number // in seconds
      }
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const RoomActivity = mongoose.model("RoomActivity", roomActivitySchema);
