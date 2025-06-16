import mongoose from 'mongoose';

const compilationResultSchema = new mongoose.Schema({
  result: mongoose.Schema.Types.Mixed,
  error: String,
  compiledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const roomActivitySchema = new mongoose.Schema({
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  codeSnapshot: {
    type: String,
    default: ""
  },
  language: {
    type: String,
    default: "cpp"
  },
  programInput: {
    type: String,
    default: ""
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    content: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    type: {
      type: String,
      enum: ['text', 'system'],
      default: 'text'
    }
  }],
  compilationHistory: [compilationResultSchema],
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export const RoomActivity = mongoose.model('RoomActivity', roomActivitySchema);
