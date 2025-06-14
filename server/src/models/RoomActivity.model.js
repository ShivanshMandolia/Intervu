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
      default: "cpp", // or "javascript", "python", etc.
    },
    recordingURL: {
      type: String, // URL or path to stored recording (e.g., cloud storage)
    },
    messages: [
      {
        sender: { type: Schema.Types.ObjectId, ref: "User" },
        content: { type: String },
        timestamp: { type: Date, default: Date.now },
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
