// backend/socket/socketServer.js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { Room } from "../models/Room.model.js";
import { RoomActivity } from "../models/RoomActivity.model.js";

class SocketServer {
  constructor() {
    this.io = null;
    this.emailToSocketIdMap = new Map();
    this.socketIdToEmailMap = new Map();
    this.socketIdToUserMap = new Map();
    this.roomToSocketsMap = new Map(); // roomId -> Set of socketIds
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Socket authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error("Authentication error: No token provided"));
        }

        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findById(decoded._id).select("-password -refreshToken");
        
        if (!user) {
          return next(new Error("Authentication error: User not found"));
        }

        socket.userId = user._id;
        socket.userEmail = user.email;
        socket.user = user;
        next();
      } catch (error) {
        console.error("Socket authentication error:", error);
        next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`✅ User ${socket.userEmail} connected with socket ID: ${socket.id}`);
      
      // Store user mappings
      this.emailToSocketIdMap.set(socket.userEmail, socket.id);
      this.socketIdToEmailMap.set(socket.id, socket.userEmail);
      this.socketIdToUserMap.set(socket.id, socket.user);

      // Socket event handlers
      this.handleRoomJoin(socket);
      this.handleRoomLeave(socket);
      this.handleUserCall(socket);
      this.handleCallAccepted(socket);
      this.handleCallRejected(socket);
      this.handlePeerNegotiation(socket);
      this.handleChatMessage(socket);
      this.handleCodeUpdate(socket);
      this.handleRecordingEvents(socket);
      this.handleDisconnection(socket);
    });

    console.log("🚀 Socket.IO server initialized");
  }

  handleRoomJoin(socket) {
    socket.on("room:join", async (data) => {
      try {
        console.log(`🔍 Room join attempt:`, {
          roomId: data.roomId,
          userId: socket.userId,
          userEmail: socket.userEmail
        });

        const { roomId } = data;
        
        if (!roomId) {
          socket.emit("room:error", { message: "Room ID is required" });
          return;
        }
        
        console.log(`🔍 Looking for room with roomId: ${roomId}`);
        let room = await Room.findOne({ roomId }).populate('participants', 'email username');
        
        // If room doesn't exist, create it
        if (!room) {
          console.log(`🏗️ Creating new room: ${roomId}`);
          room = new Room({
            roomId,
            name: `Room ${roomId}`,
            createdBy: socket.userId,
            participants: [socket.userId]
          });
          await room.save();
          
          // Populate the creator info
          room = await Room.findOne({ roomId })
            .populate('createdBy', 'email username')
            .populate('participants', 'email username');
        } else {
          // Add user to participants if not already there
          const isParticipant = room.participants.some(p => p._id.toString() === socket.userId.toString());
          const isCreator = room.createdBy._id.toString() === socket.userId.toString();
          
          if (!isParticipant && !isCreator) {
            room.participants.push(socket.userId);
            await room.save();
            
            // Re-fetch with populated data
            room = await Room.findOne({ roomId })
              .populate('createdBy', 'email username')
              .populate('participants', 'email username');
          }
        }

        console.log(`✅ Room ready:`, room.name);

        // Join socket room
        socket.join(roomId);
        socket.currentRoom = roomId;

        // Update room mappings
        if (!this.roomToSocketsMap.has(roomId)) {
          this.roomToSocketsMap.set(roomId, new Set());
        }
        this.roomToSocketsMap.get(roomId).add(socket.id);

        // Notify other users in room
        socket.to(roomId).emit("user:joined", {
          email: socket.userEmail,
          userId: socket.userId,
          socketId: socket.id,
          user: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });

        // Get current participants
        const roomSockets = Array.from(this.roomToSocketsMap.get(roomId) || [])
          .filter(id => id !== socket.id)
          .map(id => ({
            socketId: id,
            user: this.socketIdToUserMap.get(id)
          }))
          .filter(participant => participant.user); // Filter out undefined users

        // Send room joined confirmation
        socket.emit("room:joined", {
          roomId,
          participants: roomSockets,
          room: room
        });

        // Initialize or update room activity
        await this.initializeRoomActivity(room._id, socket.userId);

        console.log(`✅ User ${socket.userEmail} joined room ${roomId}`);
      } catch (error) {
        console.error("❌ Error joining room:", error);
        socket.emit("room:error", { 
          message: error.message || "Failed to join room" 
        });
      }
    });
  }

  async initializeRoomActivity(roomObjectId, userId) {
    try {
      let activity = await RoomActivity.findOne({ room: roomObjectId });
      
      if (!activity) {
        activity = new RoomActivity({
          room: roomObjectId,
          codeSnapshot: "",
          language: "cpp"
        });
        await activity.save();
        console.log(`📝 Created new activity for room ${roomObjectId}`);
      }
      
      return activity;
    } catch (error) {
      console.error("Error initializing room activity:", error);
    }
  }

  handleRoomLeave(socket) {
    socket.on("room:leave", (data) => {
      const { roomId } = data;
      this.leaveRoom(socket, roomId);
    });
  }

  handleUserCall(socket) {
    socket.on("user:call", ({ to, offer, roomId }) => {
      console.log(`📞 Call initiated from ${socket.id} to ${to}`);
      this.io.to(to).emit("incoming:call", {
        from: socket.id,
        offer,
        caller: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        },
        roomId
      });
    });
  }

  handleCallAccepted(socket) {
    socket.on("call:accepted", ({ to, answer }) => {
      console.log(`✅ Call accepted by ${socket.id} to ${to}`);
      this.io.to(to).emit("call:accepted", {
        from: socket.id,
        answer,
        accepter: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        }
      });
    });
  }

  handleCallRejected(socket) {
    socket.on("call:rejected", ({ to, reason }) => {
      console.log(`❌ Call rejected by ${socket.id} to ${to}`);
      this.io.to(to).emit("call:rejected", {
        from: socket.id,
        reason: reason || "Call declined"
      });
    });
  }

  handlePeerNegotiation(socket) {
    socket.on("peer:nego:needed", ({ to, offer }) => {
      console.log("🔄 Peer negotiation needed:", socket.id, "->", to);
      this.io.to(to).emit("peer:nego:needed", {
        from: socket.id,
        offer
      });
    });

    socket.on("peer:nego:done", ({ to, answer }) => {
      console.log("✅ Peer negotiation done:", socket.id, "->", to);
      this.io.to(to).emit("peer:nego:final", {
        from: socket.id,
        answer
      });
    });
  }

  handleChatMessage(socket) {
    socket.on("chat:message", async ({ roomId, message }) => {
      try {
        if (!message || message.trim() === "") {
          return;
        }

        const messageData = {
          _id: Date.now().toString(),
          sender: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          },
          content: message.trim(),
          timestamp: new Date(),
          type: "text"
        };

        // Broadcast to all users in the room
        this.io.to(roomId).emit("chat:message", messageData);

        // Save message to activity (optional, for persistence)
        try {
          const room = await Room.findOne({ roomId });
          if (room) {
            let activity = await RoomActivity.findOne({ room: room._id });
            if (activity) {
              activity.messages.push({
                sender: socket.userId,
                content: message.trim(),
                timestamp: new Date(),
                type: "text"
              });
              await activity.save();
            }
          }
        } catch (saveError) {
          console.error("Error saving message to activity:", saveError);
        }

        console.log(`💬 Message sent in room ${roomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling chat message:", error);
        socket.emit("room:error", { message: "Failed to send message" });
      }
    });
  }

  handleCodeUpdate(socket) {
    socket.on("code:update", async ({ roomId, code, language }) => {
      try {
        // Broadcast code changes to all users in the room except sender
        socket.to(roomId).emit("code:update", {
          code,
          language,
          updatedBy: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });

        // Update activity with latest code snapshot
        try {
          const room = await Room.findOne({ roomId });
          if (room) {
            let activity = await RoomActivity.findOne({ room: room._id });
            if (activity) {
              activity.codeSnapshot = code;
              activity.language = language;
              activity.updatedAt = new Date();
              await activity.save();
            }
          }
        } catch (saveError) {
          console.error("Error saving code to activity:", saveError);
        }

        console.log(`💻 Code updated in room ${roomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling code update:", error);
      }
    });

    socket.on("code:cursor", ({ roomId, position, selection }) => {
      socket.to(roomId).emit("code:cursor", {
        position,
        selection,
        user: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        }
      });
    });
  }

  handleRecordingEvents(socket) {
    socket.on("recording:start", ({ roomId }) => {
      console.log(`🎥 Recording started in room ${roomId} by ${socket.userEmail}`);
      socket.to(roomId).emit("recording:started", {
        startedBy: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        }
      });
    });

    socket.on("recording:stop", ({ roomId, recordingUrl, duration }) => {
      console.log(`⏹️ Recording stopped in room ${roomId} by ${socket.userEmail}`);
      socket.to(roomId).emit("recording:stopped", {
        stoppedBy: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        },
        recordingUrl,
        duration
      });
    });
  }

  handleDisconnection(socket) {
    socket.on("disconnect", (reason) => {
      console.log(`❌ User ${socket.userEmail} disconnected: ${reason}`);
      
      // Clean up mappings
      this.emailToSocketIdMap.delete(socket.userEmail);
      this.socketIdToEmailMap.delete(socket.id);
      this.socketIdToUserMap.delete(socket.id);

      // Leave room and notify others
      if (socket.currentRoom) {
        this.leaveRoom(socket, socket.currentRoom);
      }
    });
  }

  leaveRoom(socket, roomId) {
    try {
      if (roomId && this.roomToSocketsMap.has(roomId)) {
        this.roomToSocketsMap.get(roomId).delete(socket.id);
        
        // If room is empty, clean up
        if (this.roomToSocketsMap.get(roomId).size === 0) {
          this.roomToSocketsMap.delete(roomId);
          console.log(`🧹 Cleaned up empty room: ${roomId}`);
        }
      }

      socket.leave(roomId);
      socket.to(roomId).emit("user:left", {
        email: socket.userEmail,
        userId: socket.userId,
        socketId: socket.id
      });

      socket.currentRoom = null;
      console.log(`👋 User ${socket.userEmail} left room ${roomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }

  // Utility method to get room participants
  getRoomParticipants(roomId) {
    const socketIds = this.roomToSocketsMap.get(roomId) || new Set();
    return Array.from(socketIds).map(socketId => ({
      socketId,
      user: this.socketIdToUserMap.get(socketId)
    }));
  }
}

export default new SocketServer();