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
    this.roomJoinLocks = new Map(); // roomId -> promise to prevent race conditions
    this.userRoomMap = new Map(); // socketId -> roomId to track current rooms
    this.roomStates = new Map(); // roomId -> { code, language, input, lastCompilation }
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
      this.handleWebRTCEvents(socket);
      this.handleChatMessage(socket);
      this.handleCodeUpdate(socket);
      this.handleInputUpdate(socket); // New: Handle shared input
      this.handleCompilation(socket); // New: Handle shared compilation
      this.handleRecordingEvents(socket);
      this.handleDisconnection(socket);
    });

    console.log("🚀 Socket.IO server initialized");
  }

  normalizeRoomId(roomId) {
    if (!roomId) return null;
    
    if (typeof roomId === 'object') {
      console.warn('⚠️ Received object as roomId:', roomId);
      return null;
    }
    
    const cleanId = roomId.toString().trim();
    if (!cleanId) return null;
    
    return cleanId;
  }

  async findRoomByAnyId(roomId) {
    if (!roomId) return null;

    try {
      let room = await Room.findOne({ roomId: roomId }).populate('participants', 'email username');
      
      if (!room) {
        const withPrefix = roomId.startsWith('room-') ? roomId : `room-${roomId}`;
        room = await Room.findOne({ roomId: withPrefix }).populate('participants', 'email username');
      }
      
      return room;
    } catch (error) {
      console.error('❌ Error finding room:', error);
      return null;
    }
  }

// Fixed checkRoomCapacity function
// Fixed checkRoomCapacity function
async checkRoomCapacity(roomId, userId) {
  try {
    const room = await this.findRoomByAnyId(roomId);
    if (!room) return { canJoin: true, reason: null };

    // **FIXED: Check active socket connections first**
    const activeSocketsInRoom = this.roomToSocketsMap.get(roomId) || new Set();
    const activeCount = activeSocketsInRoom.size;

    console.log(`🔍 Enhanced capacity check for ${roomId}:`, {
      maxParticipants: room.maxParticipants,
      dbParticipants: room.participants.length,
      activeSocketsInRoom: activeCount,
      userId: userId.toString()
    });

    // Check if user is already a participant or creator
    const isExistingParticipant = room.participants.some(p => 
      p._id.toString() === userId.toString()
    );
    const isCreator = room.createdBy && room.createdBy._id.toString() === userId.toString();

    // **FIXED: Check if user already has an active socket in room**
    const userSocketIds = [];
    for (const [socketId, email] of this.socketIdToEmailMap.entries()) {
      const socketUser = this.socketIdToUserMap.get(socketId);
      if (socketUser && socketUser._id.toString() === userId.toString()) {
        userSocketIds.push(socketId);
      }
    }
    
    const hasActiveSocket = userSocketIds.some(socketId => 
      activeSocketsInRoom.has(socketId)
    );

    // Always allow existing participants/creators to rejoin
    if (isExistingParticipant || isCreator || hasActiveSocket) {
      console.log(`✅ User ${userId} is existing participant/creator - allowing rejoin`);
      return { canJoin: true, reason: null };
    }

    // **FIXED: Use active socket count for capacity check**
    if (activeCount >= room.maxParticipants) {
      return { 
        canJoin: false, 
        reason: `Room is full (${activeCount}/${room.maxParticipants} participants)`,
        code: "ROOM_FULL"
      };
    }

    return { canJoin: true, reason: null };
  } catch (error) {
    console.error('❌ Error checking room capacity:', error);
    return { canJoin: false, reason: 'Error checking room capacity' };
  }
}

  async findOrCreateRoom(roomId, userId) {
    const normalizedRoomId = this.normalizeRoomId(roomId);
    
    if (!normalizedRoomId) {
      throw new Error('Invalid room ID provided');
    }

    // Use a lock to prevent race conditions
    if (this.roomJoinLocks.has(normalizedRoomId)) {
      await this.roomJoinLocks.get(normalizedRoomId);
      return await this.findRoomByAnyId(normalizedRoomId);
    }

    const lockPromise = this.findOrCreateRoomInternal(normalizedRoomId, userId);
    this.roomJoinLocks.set(normalizedRoomId, lockPromise);
    
    try {
      const room = await lockPromise;
      return room;
    } finally {
      this.roomJoinLocks.delete(normalizedRoomId);
    }
  }

  async findOrCreateRoomInternal(roomId, userId) {
    let room = await this.findRoomByAnyId(roomId);
    
    if (!room) {
      console.log(`🏗️ Creating new room: ${roomId}`);
      try {
        room = new Room({
          roomId,
          name: `Room ${roomId.replace('room-', '')}`,
          createdBy: userId,
          participants: [userId],
          maxParticipants: 2 // Explicitly set to 2
        });
        await room.save();
        
        room = await Room.findOne({ roomId })
          .populate('createdBy', 'email username')
          .populate('participants', 'email username');
          
        console.log(`✅ Room created successfully: ${roomId} with max participants: 2`);
      } catch (error) {
        if (error.code === 11000) {
          console.log(`📋 Room already exists, fetching: ${roomId}`);
          room = await this.findRoomByAnyId(roomId);
        } else {
          throw error;
        }
      }
    }
    
    return room;
  }

  handleRoomJoin(socket) {
  socket.on("room:join", async (data) => {
    try {
      const { roomId: originalRoomId } = data;
      
      if (!originalRoomId) {
        socket.emit("room:error", { message: "Room ID is required" });
        return;
      }

      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      
      if (!normalizedRoomId) {
        socket.emit("room:error", { message: "Invalid room ID format" });
        return;
      }

      console.log(`🔍 Room join attempt:`, {
        socketId: socket.id,
        originalRoomId: originalRoomId,
        normalizedRoomId: normalizedRoomId,
        userId: socket.userId,
        userEmail: socket.userEmail
      });

      // **FIXED: Check if user is already in this room (socket level)**
      const currentRoom = this.userRoomMap.get(socket.id);
      if (currentRoom === normalizedRoomId) {
        console.log(`🔄 User ${socket.userEmail} already in room ${normalizedRoomId} - sending current state`);
        
        const roomSockets = this.getRoomParticipants(normalizedRoomId)
          .filter(p => p.socketId !== socket.id && p.user);
        
        const roomState = this.roomStates.get(normalizedRoomId) || {};
        
        socket.emit("room:joined", {
          roomId: normalizedRoomId,
          participants: roomSockets,
          room: await this.findRoomByAnyId(normalizedRoomId),
          roomState: roomState
        });
        return;
      }

      // Leave current room if in one
      if (currentRoom) {
        console.log(`🚪 Leaving current room: ${currentRoom}`);
        this.leaveRoom(socket, currentRoom);
      }

      // **FIXED: Enhanced capacity check with retry logic**
      let capacityCheck = await this.checkRoomCapacity(normalizedRoomId, socket.userId);
      
      // **FIXED: Retry capacity check once after small delay (handles race conditions)**
      if (!capacityCheck.canJoin && capacityCheck.code === "ROOM_FULL") {
        console.log(`🔄 Room appears full, retrying capacity check in 500ms...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        capacityCheck = await this.checkRoomCapacity(normalizedRoomId, socket.userId);
      }
      
      if (!capacityCheck.canJoin) {
        console.log(`🚫 Room join denied: ${capacityCheck.reason}`);
        socket.emit("room:error", { 
          message: capacityCheck.reason,
          code: capacityCheck.code || "ROOM_FULL"
        });
        return;
      }
      
      let room = await this.findOrCreateRoom(normalizedRoomId, socket.userId);
      
      if (!room) {
        socket.emit("room:error", { message: "Failed to create or find room" });
        return;
      }

      // **FIXED: Better participant management with atomic operations**
      const isParticipant = room.participants.some(p => p._id.toString() === socket.userId.toString());
      const isCreator = room.createdBy && room.createdBy._id.toString() === socket.userId.toString();
      
      if (!isParticipant && !isCreator) {
        // **FIXED: Final capacity check with lock**
        const activeSocketsInRoom = this.roomToSocketsMap.get(normalizedRoomId) || new Set();
        if (activeSocketsInRoom.size >= room.maxParticipants) {
          socket.emit("room:error", { 
            message: `Room is full (${activeSocketsInRoom.size}/${room.maxParticipants} participants)`,
            code: "ROOM_FULL"
          });
          return;
        }

        room.participants.push(socket.userId);
        await room.save();
        
        // Refresh room data
        room = await Room.findOne({ roomId: normalizedRoomId })
          .populate('createdBy', 'email username')
          .populate('participants', 'email username');
      }

      // **CRITICAL: Join socket room BEFORE updating tracking**
      socket.join(normalizedRoomId);
      
      // **FIXED: Update tracking maps atomically**
      this.userRoomMap.set(socket.id, normalizedRoomId);
      if (!this.roomToSocketsMap.has(normalizedRoomId)) {
        this.roomToSocketsMap.set(normalizedRoomId, new Set());
      }
      this.roomToSocketsMap.get(normalizedRoomId).add(socket.id);

      // Initialize room state if not exists
      if (!this.roomStates.has(normalizedRoomId)) {
        this.roomStates.set(normalizedRoomId, {
          code: '',
          language: 'cpp',
          programInput: '',
          lastCompilation: null
        });
      }

      // Get current participants (excluding the joining user)
      const roomSockets = this.getRoomParticipants(normalizedRoomId)
        .filter(p => p.socketId !== socket.id && p.user);

      // Get current room state
      const roomState = this.roomStates.get(normalizedRoomId);

      console.log(`✅ User ${socket.userEmail} successfully joined room ${normalizedRoomId}`);
      console.log(`📊 Room ${normalizedRoomId} now has ${this.roomToSocketsMap.get(normalizedRoomId).size} socket participants`);

      // **CRITICAL: Send room joined confirmation IMMEDIATELY**
      socket.emit("room:joined", {
        roomId: normalizedRoomId,
        participants: roomSockets,
        room: room,
        roomState: roomState
      });

      // **CRITICAL: Notify other users AFTER successful join with delay**
      setTimeout(() => {
        socket.to(normalizedRoomId).emit("user:joined", {
          email: socket.userEmail,
          userId: socket.userId,
          socketId: socket.id,
          user: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });
      }, 100);

      // Initialize room activity
      await this.initializeRoomActivity(room._id, socket.userId);
      
    } catch (error) {
      console.error("❌ Error joining room:", error);
      socket.emit("room:error", { 
        message: error.message || "Failed to join room",
        code: "JOIN_ERROR"
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
          language: "cpp",
          programInput: ""
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
      const { roomId: originalRoomId } = data;
      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      if (normalizedRoomId) {
        this.leaveRoom(socket, normalizedRoomId);
      }
    });
  }

  handleUserCall(socket) {
    socket.on("user:call", ({ to, offer, roomId }) => {
      const normalizedRoomId = this.normalizeRoomId(roomId);
      
      console.log(`📞 Call initiated from ${socket.id} to ${to} in room ${normalizedRoomId}`);
      this.io.to(to).emit("incoming:call", {
        from: socket.id,
        offer,
        caller: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        },
        roomId: normalizedRoomId
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

  handleWebRTCEvents(socket) {
    socket.on("webrtc:offer", ({ to, offer }) => {
      console.log(`📡 WebRTC offer from ${socket.id} to ${to}`);
      this.io.to(to).emit("webrtc:offer", {
        from: socket.id,
        offer
      });
    });

    socket.on("webrtc:answer", ({ to, answer }) => {
      console.log(`📡 WebRTC answer from ${socket.id} to ${to}`);
      this.io.to(to).emit("webrtc:answer", {
        from: socket.id,
        answer
      });
    });

    socket.on("webrtc:ice-candidate", ({ to, candidate }) => {
      console.log(`🧊 ICE candidate from ${socket.id} to ${to}`);
      this.io.to(to).emit("webrtc:ice-candidate", {
        from: socket.id,
        candidate
      });
    });
  }

  handleChatMessage(socket) {
    socket.on("chat:message", async ({ roomId: originalRoomId, message }) => {
      try {
        if (!message || message.trim() === "") return;

        const normalizedRoomId = this.normalizeRoomId(originalRoomId);
        if (!normalizedRoomId) return;

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

        this.io.to(normalizedRoomId).emit("chat:message", messageData);

        try {
          const room = await this.findRoomByAnyId(normalizedRoomId);
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
          console.error("Error saving message:", saveError);
        }

        console.log(`💬 Message sent in room ${normalizedRoomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling chat message:", error);
      }
    });
  }

  handleCodeUpdate(socket) {
    socket.on("code:update", async ({ roomId: originalRoomId, code, language }) => {
      try {
        const normalizedRoomId = this.normalizeRoomId(originalRoomId);
        if (!normalizedRoomId) return;

        // Update room state
        const roomState = this.roomStates.get(normalizedRoomId) || {};
        roomState.code = code;
        roomState.language = language;
        this.roomStates.set(normalizedRoomId, roomState);

        // Broadcast to other users in the room
        socket.to(normalizedRoomId).emit("code:update", {
          code,
          language,
          updatedBy: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });

        // Save to database
        try {
          const room = await this.findRoomByAnyId(normalizedRoomId);
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
          console.error("Error saving code:", saveError);
        }

        console.log(`💻 Code updated in room ${normalizedRoomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling code update:", error);
      }
    });

    socket.on("code:cursor", ({ roomId: originalRoomId, position, selection }) => {
      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      if (!normalizedRoomId) return;
      
      socket.to(normalizedRoomId).emit("code:cursor", {
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

  // NEW: Handle shared input updates
  handleInputUpdate(socket) {
    socket.on("input:update", async ({ roomId: originalRoomId, input }) => {
      try {
        const normalizedRoomId = this.normalizeRoomId(originalRoomId);
        if (!normalizedRoomId) return;

        // Update room state
        const roomState = this.roomStates.get(normalizedRoomId) || {};
        roomState.programInput = input;
        this.roomStates.set(normalizedRoomId, roomState);

        // Broadcast to other users in the room
        socket.to(normalizedRoomId).emit("input:update", {
          input,
          updatedBy: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });

        // Save to database
        try {
          const room = await this.findRoomByAnyId(normalizedRoomId);
          if (room) {
            let activity = await RoomActivity.findOne({ room: room._id });
            if (activity) {
              activity.programInput = input;
              activity.updatedAt = new Date();
              await activity.save();
            }
          }
        } catch (saveError) {
          console.error("Error saving input:", saveError);
        }

        console.log(`📥 Input updated in room ${normalizedRoomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling input update:", error);
      }
    });
  }

  // NEW: Handle shared compilation
  handleCompilation(socket) {
    socket.on("compilation:start", ({ roomId: originalRoomId }) => {
      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      if (!normalizedRoomId) return;

      // Broadcast compilation start to all users in room
      this.io.to(normalizedRoomId).emit("compilation:start", {
        startedBy: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        }
      });

      console.log(`🚀 Compilation started in room ${normalizedRoomId} by ${socket.userEmail}`);
    });

    socket.on("compilation:result", async ({ roomId: originalRoomId, result, error }) => {
      try {
        const normalizedRoomId = this.normalizeRoomId(originalRoomId);
        if (!normalizedRoomId) return;

        // Update room state with compilation result
        const roomState = this.roomStates.get(normalizedRoomId) || {};
        roomState.lastCompilation = {
          result,
          error,
          timestamp: new Date(),
          compiledBy: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        };
        this.roomStates.set(normalizedRoomId, roomState);

        // Broadcast compilation result to all users in room
        this.io.to(normalizedRoomId).emit("compilation:result", {
          result,
          error,
          compiledBy: {
            _id: socket.user._id,
            email: socket.user.email,
            username: socket.user.username
          }
        });

        // Save compilation result to database
        try {
          const room = await this.findRoomByAnyId(normalizedRoomId);
          if (room) {
            let activity = await RoomActivity.findOne({ room: room._id });
            if (activity) {
              if (!activity.compilationHistory) {
                activity.compilationHistory = [];
              }
              activity.compilationHistory.push({
                result,
                error,
                timestamp: new Date(),
                compiledBy: socket.userId
              });
              // Keep only last 10 compilation results
              if (activity.compilationHistory.length > 10) {
                activity.compilationHistory = activity.compilationHistory.slice(-10);
              }
              await activity.save();
            }
          }
        } catch (saveError) {
          console.error("Error saving compilation result:", saveError);
        }

        console.log(`✅ Compilation result shared in room ${normalizedRoomId} by ${socket.userEmail}`);
      } catch (error) {
        console.error("Error handling compilation result:", error);
      }
    });
  }

  handleRecordingEvents(socket) {
    socket.on("recording:start", ({ roomId: originalRoomId }) => {
      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      if (!normalizedRoomId) return;
      
      console.log(`🎥 Recording started in room ${normalizedRoomId} by ${socket.userEmail}`);
      socket.to(normalizedRoomId).emit("recording:started", {
        startedBy: {
          _id: socket.user._id,
          email: socket.user.email,
          username: socket.user.username
        }
      });
    });

    socket.on("recording:stop", ({ roomId: originalRoomId, recordingUrl, duration }) => {
      const normalizedRoomId = this.normalizeRoomId(originalRoomId);
      if (!normalizedRoomId) return;
      
      console.log(`⏹️ Recording stopped in room ${normalizedRoomId} by ${socket.userEmail}`);
      socket.to(normalizedRoomId).emit("recording:stopped", {
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
      
      const currentRoom = this.userRoomMap.get(socket.id);
      
      this.emailToSocketIdMap.delete(socket.userEmail);
      this.socketIdToEmailMap.delete(socket.id);
      this.socketIdToUserMap.delete(socket.id);
      this.userRoomMap.delete(socket.id);

      if (currentRoom) {
        this.leaveRoom(socket, currentRoom);
      }
    });
  }

  leaveRoom(socket, roomId) {
    try {
      const normalizedRoomId = this.normalizeRoomId(roomId);
      if (!normalizedRoomId) return;
      
      if (this.roomToSocketsMap.has(normalizedRoomId)) {
        this.roomToSocketsMap.get(normalizedRoomId).delete(socket.id);
        
        if (this.roomToSocketsMap.get(normalizedRoomId).size === 0) {
          this.roomToSocketsMap.delete(normalizedRoomId);
          // Clean up room state when room is empty
          this.roomStates.delete(normalizedRoomId);
          console.log(`🧹 Cleaned up empty room: ${normalizedRoomId}`);
        } else {
          console.log(`📊 Room ${normalizedRoomId} now has ${this.roomToSocketsMap.get(normalizedRoomId).size} participants`);
        }
      }

      socket.leave(normalizedRoomId);
      this.userRoomMap.delete(socket.id);
      
      socket.to(normalizedRoomId).emit("user:left", {
        email: socket.userEmail,
        userId: socket.userId,
        socketId: socket.id
      });

      console.log(`👋 User ${socket.userEmail} left room ${normalizedRoomId}`);
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }

  getRoomParticipants(roomId) {
    const normalizedRoomId = this.normalizeRoomId(roomId);
    if (!normalizedRoomId) return [];
    
    const socketIds = this.roomToSocketsMap.get(normalizedRoomId) || new Set();
    const participants = [];
    
    for (const socketId of socketIds) {
      const email = this.socketIdToEmailMap.get(socketId);
      const user = this.socketIdToUserMap.get(socketId);
      
      if (user && email) {
        participants.push({
          socketId,
          email,
          user
        });
      }
    }
    
    return participants;
  }
}

export default new SocketServer();

