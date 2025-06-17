// frontend/src/contexts/RoomContext.jsx
import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";
import { useSocket } from "./SocketContext";
import { useAuth } from "./auth/AuthContext";

const RoomContext = createContext(null);

// Room state reducer
const roomReducer = (state, action) => {
  switch (action.type) {
    case "SET_ROOM_INFO":
      return {
        ...state,
        roomId: action.payload.roomId,
        room: action.payload.room,
        isInRoom: true,
        error: null,
      };
    
    case "ADD_PARTICIPANT":
      // Avoid duplicate participants
      const existingParticipant = state.participants.find(p => p.socketId === action.payload.socketId);
      if (existingParticipant) {
        return state;
      }
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };
    
    case "REMOVE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.filter(p => p.socketId !== action.payload.socketId),
      };
    
    case "SET_PARTICIPANTS":
      return {
        ...state,
        participants: action.payload || [],
      };
    
    case "ADD_CHAT_MESSAGE":
      return {
        ...state,
        chatMessages: [...state.chatMessages, action.payload],
      };
    
    case "UPDATE_CODE":
      return {
        ...state,
        code: action.payload.code,
        language: action.payload.language,
      };
    
    case "SET_RECORDING_STATUS":
      return {
        ...state,
        isRecording: action.payload.isRecording,
        recordingUrl: action.payload.recordingUrl || state.recordingUrl,
      };
    
    case "LEAVE_ROOM":
      return {
        ...initialState,
      };
    
    case "SET_ERROR":
      return {
        ...state,
        error: action.payload,
        isInRoom: action.payload?.type !== "ROOM_FULL" ? false : state.isInRoom,
      };
    
    case "CLEAR_ERROR":
      return {
        ...state,
        error: null,
      };
    
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload,
      };
    
    default:
      return state;
  }
};

const initialState = {
  roomId: null,
  room: null,
  isInRoom: false,
  participants: [],
  chatMessages: [],
  code: "",
  language: "cpp",
  isRecording: false,
  recordingUrl: null,
  loading: false,
  error: null,
};

export const useRoom = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error("useRoom must be used within a RoomProvider");
  }
  return context;
};

export const RoomProvider = ({ children }) => {
  const { socket, isConnected, connectionError } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(roomReducer, initialState);

  // Room ID validation and normalization
  const normalizeRoomId = useCallback((roomId) => {
    if (!roomId) return null;
    
    const cleanId = roomId.toString().replace(/^room-/, '');
    return `room-${cleanId}`;
  }, []);

  // Create room URL helper
  const createRoomUrl = useCallback((baseRoomId) => {
    const cleanId = baseRoomId.toString().replace(/^room-/, '');
    return `/room/${cleanId}`;
  }, []);

  // Debug logging
  const debugRoomId = useCallback((location, roomId) => {
    console.log(`🔍 Room ID Debug [${location}]:`, {
      original: roomId,
      hasPrefix: typeof roomId === 'string' ? roomId.startsWith('room-') : false,
      length: roomId?.length,
      type: typeof roomId
    });
  }, []);

  // Clear error function
  const clearError = useCallback(() => {
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  // Set error function
  const setError = useCallback((error) => {
    dispatch({
      type: "SET_ERROR",
      payload: error
    });
  }, []);

  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      dispatch({
        type: "SET_ERROR",
        payload: `Connection error: ${connectionError}`
      });
    }
  }, [connectionError]);

  // Socket event handlers - Enhanced for WebRTC integration
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not ready for room events');
      return;
    }

    console.log('Setting up room socket events');

    // Room joined handler - FIXED: This was missing in the original code
    const handleRoomJoined = (data) => {
      console.log("Room joined event received:", data);
      
      dispatch({
        type: "SET_ROOM_INFO",
        payload: {
          roomId: data.roomId,
          room: data.room || data
        }
      });

      // Set participants if provided
      if (data.participants) {
        dispatch({
          type: "SET_PARTICIPANTS",
          payload: data.participants
        });
      }

      // Emit for WebRTC context
      if (socket) {
        console.log('🎉 Emitting room:joined for WebRTC');
        socket.emit('webrtc:room-joined', data);
      }
    };

    const handleUserJoined = (data) => {
      console.log("User joined event received:", data);
      
      // Ensure proper data structure for WebRTC
      const participantData = {
        socketId: data.socketId || data.id,
        user: data.user || data,
        email: data.user?.email || data.email,
        username: data.user?.username || data.username,
        ...data
      };

      dispatch({
        type: "ADD_PARTICIPANT",
        payload: participantData
      });

      // The WebRTC context is already listening for 'user:joined'
      // So this event will be automatically handled by WebRTC
    };

    const handleUserLeft = (data) => {
      console.log("User left event received:", data);
      
      const participantData = {
        socketId: data.socketId || data.id,
        ...data
      };

      dispatch({
        type: "REMOVE_PARTICIPANT",
        payload: participantData
      });

      // The WebRTC context is already listening for 'user:left'
      // So this event will be automatically handled by WebRTC
    };

    const handleRoomLeft = () => {
      console.log("Room left event received");
      dispatch({ type: "LEAVE_ROOM" });
      
      // Emit room:left event for WebRTC context
      if (socket) {
        console.log('🚪 Emitting room:left for WebRTC');
        socket.emit('webrtc:room-left');
      }
    };

    // Enhanced room error handler with special ROOM_FULL handling
    const handleRoomError = (error) => {
      console.error("Room error event received:", error);
      
      // Special handling for room full error
      if (error.code === "ROOM_FULL") {
        dispatch({
          type: "SET_ERROR",
          payload: {
            message: error.message,
            type: "ROOM_FULL",
            code: error.code
          }
        });
      } else {
        dispatch({
          type: "SET_ERROR",
          payload: error.message || error
        });
      }

      // Also emit for WebRTC context
      if (socket) {
        socket.emit('webrtc:room-error', error);
      }
    };

    const handleChatMessage = (message) => {
      console.log("Chat message received:", message);
      dispatch({
        type: "ADD_CHAT_MESSAGE",
        payload: message
      });
    };

    const handleCodeUpdate = (data) => {
      console.log("Code update received:", data);
      dispatch({
        type: "UPDATE_CODE",
        payload: { code: data.code, language: data.language }
      });
    };

    const handleRecordingStarted = (data) => {
      console.log("Recording started:", data);
      dispatch({
        type: "SET_RECORDING_STATUS",
        payload: { isRecording: true }
      });
    };

    const handleRecordingStopped = (data) => {
      console.log("Recording stopped:", data);
      dispatch({
        type: "SET_RECORDING_STATUS",
        payload: { isRecording: false, recordingUrl: data.recordingUrl }
      });
    };

    // Attach event listeners
    socket.on("room:joined", handleRoomJoined);
    socket.on("room:left", handleRoomLeft);
    socket.on("user:joined", handleUserJoined);
    socket.on("user:left", handleUserLeft);
    socket.on("room:error", handleRoomError);
    socket.on("chat:message", handleChatMessage);
    socket.on("code:update", handleCodeUpdate);
    socket.on("recording:started", handleRecordingStarted);
    socket.on("recording:stopped", handleRecordingStopped);

    // Cleanup function
    return () => {
      console.log('Cleaning up room socket events');
      socket.off("room:joined", handleRoomJoined);
      socket.off("room:left", handleRoomLeft);
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("room:error", handleRoomError);
      socket.off("chat:message", handleChatMessage);
      socket.off("code:update", handleCodeUpdate);
      socket.off("recording:started", handleRecordingStarted);
      socket.off("recording:stopped", handleRecordingStopped);
    };
  }, [socket, isConnected]);

  // Room actions
  const joinRoom = useCallback(async (roomId) => {
    if (!socket || !isConnected) {
      console.error("Socket not connected");
      dispatch({
        type: "SET_ERROR",
        payload: "Socket not connected"
      });
      return;
    }
   

    if (!roomId) {
      console.error("Room ID is required");
      dispatch({
        type: "SET_ERROR",
        payload: "Room ID is required"
      });
      return;
    }

    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const normalizedRoomId = normalizeRoomId(roomId);
      debugRoomId('JOIN_ROOM_ATTEMPT', normalizedRoomId);

      console.log(`🚀 Attempting to join room: ${normalizedRoomId}`);
      
      // Include user information for WebRTC
      const joinData = {
        roomId: normalizedRoomId,
        user: user
      };
      
      socket.emit("room:join", joinData);
      
    } catch (error) {
      console.error("Error joining room:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error.message || "Failed to join room"
      });
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, [socket, isConnected, normalizeRoomId, debugRoomId, user]);

  const leaveRoom = useCallback(() => {
    if (!socket || !state.roomId) {
      console.log("No room to leave or socket not connected");
      return;
    }

    try {
      console.log(`👋 Leaving room: ${state.roomId}`);
      socket.emit("room:leave", { roomId: state.roomId });
      dispatch({ type: "LEAVE_ROOM" });
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  }, [socket, state.roomId]);

  const sendChatMessage = useCallback((message) => {
    if (!socket || !state.roomId || !message.trim()) {
      console.log("Cannot send message: socket, room, or message missing");
      return;
    }

    try {
      debugRoomId('SEND_CHAT_MESSAGE', state.roomId);
      console.log(`💬 Sending message to room: ${state.roomId}`);
      
      socket.emit("chat:message", {
        roomId: state.roomId,
        message: message.trim(),
        user: user
      });
    } catch (error) {
      console.error("Error sending chat message:", error);
    }
  }, [socket, state.roomId, debugRoomId, user]);

  const updateCode = useCallback((code, language) => {
    if (!socket || !state.roomId) {
      console.log("Cannot update code: socket or room missing");
      return;
    }

    try {
      debugRoomId('UPDATE_CODE', state.roomId);
      console.log(`💻 Updating code in room: ${state.roomId}`);
      
      socket.emit("code:update", {
        roomId: state.roomId,
        code,
        language,
        user: user
      });

      // Update local state immediately for responsiveness
      dispatch({
        type: "UPDATE_CODE",
        payload: { code, language }
      });
    } catch (error) {
      console.error("Error updating code:", error);
    }
  }, [socket, state.roomId, debugRoomId, user]);

  const updateCursor = useCallback((position, selection) => {
    if (!socket || !state.roomId) {
      return;
    }

    try {
      socket.emit("code:cursor", {
        roomId: state.roomId,
        position,
        selection,
        user: user
      });
    } catch (error) {
      console.error("Error updating cursor:", error);
    }
  }, [socket, state.roomId, user]);

  // Helper function to get participant by socket ID (useful for WebRTC integration)
  const getParticipantBySocketId = useCallback((socketId) => {
    return state.participants.find(p => p.socketId === socketId);
  }, [state.participants]);

  // Helper function to get current user's participant data
  const getCurrentUserParticipant = useCallback(() => {
    return state.participants.find(p => p.socketId === socket?.id);
  }, [state.participants, socket?.id]);

  const contextValue = {
    // State
    ...state,
    
    // Computed values
    isConnected,
    connectionError,
    
    // Actions
    joinRoom,
    leaveRoom,
    sendChatMessage,
    updateCode,
    updateCursor,
    clearError,
    setError,
    
    // Utility functions
    normalizeRoomId,
    createRoomUrl,
    debugRoomId,
    getParticipantBySocketId,
    getCurrentUserParticipant,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};