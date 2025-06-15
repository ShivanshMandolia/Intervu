// frontend/src/contexts/RoomActivityContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './auth/AuthContext';

const RoomActivityContext = createContext(null);

const activityReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CURRENT_ACTIVITY':
      return {
        ...state,
        currentActivity: action.payload,
        loading: false
      };
    
    case 'SET_ACTIVITY_HISTORY':
      return {
        ...state,
        activityHistory: action.payload,
        loading: false
      };
    
    case 'ADD_MESSAGE':
      return {
        ...state,
        currentActivity: {
          ...state.currentActivity,
          messages: [...(state.currentActivity?.messages || []), action.payload]
        }
      };
    
    case 'ADD_CODE_HISTORY':
      return {
        ...state,
        currentActivity: {
          ...state.currentActivity,
          codeHistory: [
            ...(state.currentActivity?.codeHistory || []),
            action.payload
          ]
        }
      };
    
    case 'UPDATE_CODE_SNAPSHOT':
      return {
        ...state,
        currentActivity: {
          ...state.currentActivity,
          codeSnapshot: action.payload.code,
          language: action.payload.language
        }
      };
    
    case 'SET_RECORDING_STATUS':
      return {
        ...state,
        recording: {
          ...state.recording,
          isRecording: action.payload.isRecording,
          recordingURL: action.payload.recordingURL || state.recording.recordingURL,
          startTime: action.payload.startTime || state.recording.startTime,
          endTime: action.payload.endTime || state.recording.endTime,
          duration: action.payload.duration || state.recording.duration
        }
      };
    
    case 'START_CALL_LOG':
      return {
        ...state,
        currentCall: {
          startTime: new Date(),
          participants: action.payload.participants,
          callId: action.payload.callId
        }
      };
    
    case 'END_CALL_LOG':
      const callDuration = state.currentCall?.startTime 
        ? Math.floor((new Date() - state.currentCall.startTime) / 1000)
        : 0;
      
      const callLog = {
        startTime: state.currentCall?.startTime,
        endTime: new Date(),
        participants: state.currentCall?.participants || [],
        duration: callDuration
      };

      return {
        ...state,
        currentActivity: {
          ...state.currentActivity,
          callLogs: [...(state.currentActivity?.callLogs || []), callLog]
        },
        currentCall: null
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'RESET_ACTIVITY':
      return {
        ...initialState
      };
    
    default:
      return state;
  }
};

const initialState = {
  currentActivity: null,
  activityHistory: [],
  currentCall: null,
  recording: {
    isRecording: false,
    recordingURL: null,
    startTime: null,
    endTime: null,
    duration: 0
  },
  loading: false,
  error: null
};

export const useRoomActivity = () => {
  const context = useContext(RoomActivityContext);
  if (!context) {
    throw new Error('useRoomActivity must be used within a RoomActivityProvider');
  }
  return context;
};

export const RoomActivityProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(activityReducer, initialState);

  // Get or create room activity
  const initializeRoomActivity = useCallback(async (roomId) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch(`/api/v1/roomactivity/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'SET_CURRENT_ACTIVITY', payload: result.data });
      } else {
        // If no activity exists, it will be created by backend
        console.log('No existing activity found, will be created automatically');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('Error initializing room activity:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load room activity' });
    }
  }, []);

  // Save/update room activity
  const saveActivity = useCallback(async (roomId, updates = {}) => {
    try {
      const response = await fetch(`/api/v1/roomactivity/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          ...state.currentActivity,
          ...updates
        })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'SET_CURRENT_ACTIVITY', payload: result.data });
      }
    } catch (error) {
      console.error('Error saving activity:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to save activity' });
    }
  }, [state.currentActivity]);

  // Add message to activity
  const addMessage = useCallback(async (roomId, content, type = 'text') => {
    try {
      const response = await fetch(`/api/v1/roomactivity/${roomId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ content, type })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'ADD_MESSAGE', payload: result.data });
      }
    } catch (error) {
      console.error('Error adding message:', error);
    }
  }, []);

  // Add code history entry
  const addCodeHistory = useCallback(async (roomId, code, language) => {
    try {
      const response = await fetch(`/api/v1/roomactivity/${roomId}/code-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({ code, language })
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'ADD_CODE_HISTORY', payload: result.data });
      }
    } catch (error) {
      console.error('Error adding code history:', error);
    }
  }, []);

  // Update code snapshot (local only, for real-time updates)
  const updateCodeSnapshot = useCallback((code, language) => {
    dispatch({ 
      type: 'UPDATE_CODE_SNAPSHOT', 
      payload: { code, language } 
    });
  }, []);

  // Get activity history for user
  const getActivityHistory = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const response = await fetch('/api/v1/roomactivity', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        dispatch({ type: 'SET_ACTIVITY_HISTORY', payload: result.data });
      }
    } catch (error) {
      console.error('Error fetching activity history:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load activity history' });
    }
  }, []);

  // Get complete activity with room info
  const getCompleteActivity = useCallback(async (roomId) => {
    try {
      const response = await fetch(`/api/v1/roomactivity/${roomId}/complete`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Error fetching complete activity:', error);
      throw error;
    }
  }, []);

  // Recording functions
  const startRecording = useCallback((roomId, participants = []) => {
    dispatch({
      type: 'SET_RECORDING_STATUS',
      payload: { 
        isRecording: true, 
        startTime: new Date() 
      }
    });

    // Start call log
    dispatch({
      type: 'START_CALL_LOG',
      payload: { 
        participants,
        callId: `call_${Date.now()}`
      }
    });

    if (socket && roomId) {
      socket.emit('recording:start', { roomId });
    }
  }, [socket]);

  const stopRecording = useCallback(async (roomId, recordingURL) => {
    const startTime = state.recording.startTime;
    const duration = startTime ? Math.floor((new Date() - startTime) / 1000) : 0;

    dispatch({
      type: 'SET_RECORDING_STATUS',
      payload: { 
        isRecording: false, 
        recordingURL,
        endTime: new Date(),
        duration
      }
    });

    // End call log
    dispatch({ type: 'END_CALL_LOG' });

    // Save recording info to activity
    await saveActivity(roomId, {
      recordingURL,
      recordingDuration: duration
    });

    if (socket && roomId) {
      socket.emit('recording:stop', { roomId, recordingURL, duration });
    }
  }, [socket, state.recording.startTime, saveActivity]);

  // Socket event listeners for real-time updates
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleActivityUpdate = (data) => {
      dispatch({ type: 'SET_CURRENT_ACTIVITY', payload: data });
    };

    const handleNewMessage = (message) => {
      dispatch({ type: 'ADD_MESSAGE', payload: message });
    };

    const handleCodeUpdate = (data) => {
      dispatch({ 
        type: 'UPDATE_CODE_SNAPSHOT', 
        payload: { code: data.code, language: data.language } 
      });
    };

    const handleRecordingStarted = () => {
      dispatch({
        type: 'SET_RECORDING_STATUS',
        payload: { isRecording: true, startTime: new Date() }
      });
    };

    const handleRecordingStopped = (data) => {
      dispatch({
        type: 'SET_RECORDING_STATUS',
        payload: { 
          isRecording: false, 
          recordingURL: data.recordingURL,
          endTime: new Date() 
        }
      });
    };

    socket.on('activity:updated', handleActivityUpdate);
    socket.on('chat:message', handleNewMessage);
    socket.on('code:update', handleCodeUpdate);
    socket.on('recording:started', handleRecordingStarted);
    socket.on('recording:stopped', handleRecordingStopped);

    return () => {
      socket.off('activity:updated', handleActivityUpdate);
      socket.off('chat:message', handleNewMessage);
      socket.off('code:update', handleCodeUpdate);
      socket.off('recording:started', handleRecordingStarted);
      socket.off('recording:stopped', handleRecordingStopped);
    };
  }, [socket, isConnected]);

  // Clean up on unmount
  const resetActivity = useCallback(() => {
    dispatch({ type: 'RESET_ACTIVITY' });
  }, []);

  const contextValue = {
    ...state,
    initializeRoomActivity,
    saveActivity,
    addMessage,
    addCodeHistory,
    updateCodeSnapshot,
    getActivityHistory,
    getCompleteActivity,
    startRecording,
    stopRecording,
    resetActivity,
    clearError: () => dispatch({ type: 'CLEAR_ERROR' })
  };

  return (
    <RoomActivityContext.Provider value={contextValue}>
      {children}
    </RoomActivityContext.Provider>
  );
};