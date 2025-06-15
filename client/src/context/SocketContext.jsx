// frontend/src/contexts/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./auth/AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};


export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);

  const token = localStorage.getItem('accessToken');

  // Debug logging
  console.log('SocketProvider - User:', user);
  console.log('SocketProvider - Token:', token ? 'Present' : 'Missing');
  // SocketContext.jsx - Add this useEffect to handle authentication
useEffect(() => {
  if (socket && isConnected && user) {
    // Send a test event to verify the connection is working
    socket.emit('test:connection', { userId: user._id });
  }
}, [socket, isConnected, user]);

  useEffect(() => {
    // Clean up previous socket
    if (socket) {
      console.log('Cleaning up previous socket');
      socket.close();
      setSocket(null);
      setIsConnected(false);
    }

    if (!token || !user) {
      console.log('Socket not created - Missing token or user');
      setSocket(null);
      setIsConnected(false);
      setConnectionError('Authentication required');
      return;
    }

    console.log('Creating socket connection...');
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
    console.log('Connecting to backend:', backendUrl);

    const newSocket = io(backendUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    });

    // Set up all event listeners before setting the socket
    newSocket.on("connect", () => {
      console.log("Socket connected successfully:", newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    });

    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
      console.error("Error type:", error.type);
      console.error("Error description:", error.description);
      console.error("Error context:", error.context);
      console.error("Error data:", error.data);
      
      setConnectionError(error.message || 'Connection failed');
      setIsConnected(false);
    });

    newSocket.on("room:error", (error) => {
      console.error("Room error:", error);
      setConnectionError(error.message || 'Room error occurred');
    });

    // Test connection
    newSocket.on("auth:success", (data) => {
      console.log("Authentication successful:", data);
    });

    newSocket.on("auth:error", (error) => {
      console.error("Authentication error:", error);
      setConnectionError("Authentication failed");
    });

    // Set the socket
    setSocket(newSocket);

    return () => {
      console.log('Cleaning up socket connection');
      if (newSocket) {
        newSocket.close();
      }
    };
  }, [token, user?.id]); // Include user.id to trigger reconnection on user change

  // Log connection status changes
  useEffect(() => {
    console.log('Socket connection status changed:', {
      connected: isConnected,
      socketId: socket?.id,
      error: connectionError
    });
  }, [isConnected, socket?.id, connectionError]);

  const contextValue = {
    socket,
    isConnected,
    connectionError,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};