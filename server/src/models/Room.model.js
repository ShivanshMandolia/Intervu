// backend/models/Room.model.js - Enhanced version
import mongoose, { Schema } from "mongoose";

const roomSchema = new Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      default: function() {
        return `Room ${this.roomId}`;
      }
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      }
    ],
    type: {
      type: String,
      enum: ["interview", "practice", "meeting"],
      default: "practice",
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
    maxParticipants: {
      type: Number,
      default: 10,
    },
    isPrivate: {
      type: Boolean,
      default: false,
    },
    password: {
      type: String, // Optional room password
    },
    settings: {
      allowScreenShare: {
        type: Boolean,
        default: true,
      },
      allowRecording: {
        type: Boolean,
        default: true,
      },
      allowChat: {
        type: Boolean,
        default: true,
      },
      language: {
        type: String,
        default: "cpp",
      }
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

export const Room = mongoose.model("Room", roomSchema);