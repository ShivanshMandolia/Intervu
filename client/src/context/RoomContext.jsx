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
        participants: action.payload,
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
        isInRoom: false,
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

  // Debug logs
  useEffect(() => {
    console.log('RoomProvider - Socket:', socket?.id);
    console.log('RoomProvider - IsConnected:', isConnected);
    console.log('RoomProvider - User:', user);
    console.log('RoomProvider - State:', state);
  }, [socket, isConnected, user, state]);
  
  // Handle connection errors
  useEffect(() => {
    if (connectionError) {
      dispatch({
        type: "SET_ERROR",
        payload: `Connection error: ${connectionError}`
      });
    }
  }, [connectionError]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isConnected) {
      console.log('Socket not ready for room events');
      return;
    }

    console.log('Setting up room socket events');

    // Room events
    const handleRoomJoined = (data) => {
      console.log("Room joined event received:", data);
      dispatch({
        type: "SET_ROOM_INFO",
        payload: { roomId: data.roomId, room: data.room }
      });
      dispatch({
        type: "SET_PARTICIPANTS",
        payload: data.participants || []
      });
    };

    const handleUserJoined = (data) => {
      console.log("User joined event received:", data);
      dispatch({
        type: "ADD_PARTICIPANT",
        payload: data
      });
    };

    const handleUserLeft = (data) => {
      console.log("User left event received:", data);
      dispatch({
        type: "REMOVE_PARTICIPANT",
        payload: data
      });
    };

    const handleRoomError = (error) => {
      console.error("Room error event received:", error);
      dispatch({
        type: "SET_ERROR",
        payload: error.message || error
      });
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
      socket.off("user:joined", handleUserJoined);
      socket.off("user:left", handleUserLeft);
      socket.off("room:error", handleRoomError);
      socket.off("chat:message", handleChatMessage);
      socket.off("code:update", handleCodeUpdate);
      socket.off("recording:started", handleRecordingStarted);
      socket.off("recording:stopped", handleRecordingStopped);
    };
  }, [socket, isConnected]);

  // Create or get room
  const createRoom = useCallback(async (roomData = {}) => {
    dispatch({ type: "SET_LOADING", payload: true });
    
    try {
      const response = await fetch('/api/v1/room/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify(roomData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create room');
      }

      const result = await response.json();
      dispatch({ type: "SET_LOADING", payload: false });
      return result.data;
    } catch (error) {
      console.error('Error creating room:', error);
      dispatch({
        type: "SET_ERROR",
        payload: error.message || 'Failed to create room'
      });
      dispatch({ type: "SET_LOADING", payload: false });
      throw error;
    }
  }, []);

  // Get room info
  const getRoomInfo = useCallback(async (roomId) => {
    try {
      const response = await fetch(`/api/v1/room/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Room not found');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error getting room info:', error);
      throw error;
    }
  }, []);

  // Join room
  const joinRoom = useCallback((roomId) => {
    console.log('JoinRoom called with:', roomId);
    console.log('Socket:', socket?.id, 'Connected:', isConnected, 'User:', user);

    if (!socket || !isConnected) {
      console.error('Cannot join room - socket not connected');
      dispatch({
        type: "SET_ERROR",
        payload: "Socket not connected"
      });
      return;
    }

    if (!user) {
      console.error('Cannot join room - user not authenticated');
      dispatch({
        type: "SET_ERROR",
        payload: "User not authenticated"
      });
      return;
    }

    console.log('Emitting room:join event');
    socket.emit("room:join", { roomId });
  }, [socket, isConnected, user]);

  // Leave room
  const leaveRoom = useCallback(() => {
    console.log('LeaveRoom called');
    if (!socket || !state.roomId) {
      console.log('Cannot leave room - no socket or roomId');
      return;
    }

    console.log('Emitting room:leave event for room:', state.roomId);
    socket.emit("room:leave", { roomId: state.roomId });
    dispatch({ type: "LEAVE_ROOM" });
  }, [socket, state.roomId]);

  // Send chat message
  const sendChatMessage = useCallback((message) => {
    if (!socket || !state.roomId || !message.trim()) return;

    console.log('Sending chat message:', message);
    socket.emit("chat:message", {
      roomId: state.roomId,
      message: message.trim()
    });
  }, [socket, state.roomId]);

  // Update code
  const updateCode = useCallback((code, language = "cpp") => {
    if (!socket || !state.roomId) return;

    console.log('Updating code');
    // Update local state immediately for better UX
    dispatch({
      type: "UPDATE_CODE",
      payload: { code, language }
    });

    // Emit to other participants
    socket.emit("code:update", {
      roomId: state.roomId,
      code,
      language
    });
  }, [socket, state.roomId]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!socket || !state.roomId) return;

    console.log('Starting recording');
    socket.emit("recording:start", { roomId: state.roomId });
    dispatch({
      type: "SET_RECORDING_STATUS",
      payload: { isRecording: true }
    });
  }, [socket, state.roomId]);

  // Stop recording
  const stopRecording = useCallback((recordingUrl) => {
    if (!socket || !state.roomId) return;

    console.log('Stopping recording');
    socket.emit("recording:stop", { 
      roomId: state.roomId, 
      recordingUrl 
    });
    dispatch({
      type: "SET_RECORDING_STATUS",
      payload: { isRecording: false, recordingUrl }
    });
  }, [socket, state.roomId]);

  // Get user's rooms
  const getUserRooms = useCallback(async () => {
    try {
      const response = await fetch('/api/v1/room/my-rooms', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch rooms');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching user rooms:', error);
      throw error;
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    console.log('Clearing room error');
    dispatch({ type: "CLEAR_ERROR" });
  }, []);

  const contextValue = {
    ...state,
    createRoom,
    getRoomInfo,
    joinRoom,
    leaveRoom,
    sendChatMessage,
    updateCode,
    startRecording,
    stopRecording,
    getUserRooms,
    clearError,
  };

  return (
    <RoomContext.Provider value={contextValue}>
      {children}
    </RoomContext.Provider>
  );
};