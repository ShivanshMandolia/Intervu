// frontend/src/context/WebRTCContext.jsx
import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './auth/AuthContext';

const WebRTCContext = createContext(null);

const webrtcReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOCAL_STREAM':
      return {
        ...state,
        localStream: action.payload,
        error: null
      };
    
    case 'ADD_REMOTE_STREAM':
      return {
        ...state,
        remoteStreams: {
          ...state.remoteStreams,
          [action.payload.socketId]: action.payload.stream
        }
      };
    
    case 'REMOVE_REMOTE_STREAM':
      const newRemoteStreams = { ...state.remoteStreams };
      delete newRemoteStreams[action.payload.socketId];
      return {
        ...state,
        remoteStreams: newRemoteStreams
      };
    
    case 'SET_CALL_STATUS':
      return {
        ...state,
        callStatus: action.payload
      };
    
    case 'ADD_PEER_CONNECTION':
      return {
        ...state,
        peerConnections: {
          ...state.peerConnections,
          [action.payload.socketId]: action.payload.peerConnection
        }
      };
    
    case 'REMOVE_PEER_CONNECTION':
      const newPeerConnections = { ...state.peerConnections };
      delete newPeerConnections[action.payload.socketId];
      return {
        ...state,
        peerConnections: newPeerConnections
      };
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    
    case 'SET_MEDIA_REQUESTING':
      return {
        ...state,
        isRequestingMedia: action.payload
      };
    
    case 'RESET_WEBRTC':
      return {
        ...initialState,
        localStream: state.localStream
      };
    
    default:
      return state;
  }
};

const initialState = {
  localStream: null,
  remoteStreams: {},
  peerConnections: {},
  callStatus: 'idle',
  error: null,
  isRequestingMedia: false
};

const iceServers = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error('useWebRTC must be used within a WebRTCProvider');
  }
  return context;
};

export const WebRTCProvider = ({ children }) => {
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  const [state, dispatch] = useReducer(webrtcReducer, initialState);
  const mediaRequestInProgress = useRef(false);

  // Clean up peer connections
  const cleanupPeerConnection = useCallback((socketId) => {
    const peerConnection = state.peerConnections[socketId];
    if (peerConnection) {
      console.log('Cleaning up peer connection for:', socketId);
      peerConnection.close();
      dispatch({ type: 'REMOVE_PEER_CONNECTION', payload: { socketId } });
      dispatch({ type: 'REMOVE_REMOTE_STREAM', payload: { socketId } });
    }
  }, [state.peerConnections]);

  // Stop local stream
  const stopLocalStream = useCallback(() => {
    if (state.localStream) {
      console.log('Stopping local stream');
      state.localStream.getTracks().forEach(track => {
        track.stop();
      });
      dispatch({ type: 'SET_LOCAL_STREAM', payload: null });
    }
  }, [state.localStream]);

  // Get user media with better error handling
  const getUserMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    // Prevent multiple simultaneous requests
    if (mediaRequestInProgress.current || state.isRequestingMedia) {
      console.log('Media request already in progress');
      return state.localStream;
    }

    // If we already have a stream, return it
    if (state.localStream) {
      console.log('Local stream already exists');
      return state.localStream;
    }

    mediaRequestInProgress.current = true;
    dispatch({ type: 'SET_MEDIA_REQUESTING', payload: true });

    try {
      console.log('Getting user media with constraints:', constraints);
      
      // Stop any existing stream first
      stopLocalStream();
      
      // Small delay to ensure device is released
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Successfully got user media');
      
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      
      // Add tracks to existing peer connections
      Object.values(state.peerConnections).forEach(peerConnection => {
        // Remove existing tracks first
        peerConnection.getSenders().forEach(sender => {
          if (sender.track) {
            peerConnection.removeTrack(sender);
          }
        });
        
        // Add new tracks
        stream.getTracks().forEach(track => {
          peerConnection.addTrack(track, stream);
        });
      });
      
      return stream;
    } catch (error) {
      console.error('Error getting user media:', error);
      let errorMessage = 'Failed to access camera/microphone';
      
      // Provide specific error messages
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow permissions and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please check your devices.';
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        errorMessage = 'Camera/microphone is being used by another application. Please close other apps and try again.';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera/microphone constraints not supported. Trying with basic settings...';
        
        // Try with basic constraints
        try {
          const basicStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
          });
          dispatch({ type: 'SET_LOCAL_STREAM', payload: basicStream });
          return basicStream;
        } catch (basicError) {
          console.error('Basic constraints also failed:', basicError);
          errorMessage = 'Failed to access camera/microphone with any settings.';
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    } finally {
      mediaRequestInProgress.current = false;
      dispatch({ type: 'SET_MEDIA_REQUESTING', payload: false });
    }
  }, [state.localStream, state.peerConnections, state.isRequestingMedia, stopLocalStream]);

  // Create peer connection for a specific user
  const createPeerConnection = useCallback((socketId) => {
    // Avoid creating duplicate connections
    if (state.peerConnections[socketId]) {
      console.log('Peer connection already exists for:', socketId);
      return state.peerConnections[socketId];
    }

    console.log('Creating peer connection for:', socketId);
    
    const peerConnection = new RTCPeerConnection({ iceServers });
    
    // Add local stream to peer connection
    if (state.localStream) {
      state.localStream.getTracks().forEach(track => {
        peerConnection.addTrack(track, state.localStream);
      });
    }
    
    // Handle remote stream
    peerConnection.ontrack = (event) => {
      console.log('Received remote stream from:', socketId);
      const [remoteStream] = event.streams;
      dispatch({
        type: 'ADD_REMOTE_STREAM',
        payload: { socketId, stream: remoteStream }
      });
    };
    
    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate to:', socketId);
        socket.emit('webrtc:ice-candidate', {
          to: socketId,
          candidate: event.candidate
        });
      }
    };
    
    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`Peer connection state with ${socketId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        dispatch({ type: 'SET_CALL_STATUS', payload: 'connected' });
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed' ||
                 peerConnection.connectionState === 'closed') {
        cleanupPeerConnection(socketId);
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${socketId}:`, peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'failed') {
        // Try ICE restart
        console.log('ICE connection failed, attempting restart');
        peerConnection.restartIce();
      }
    };
    
    dispatch({
      type: 'ADD_PEER_CONNECTION',
      payload: { socketId, peerConnection }
    });
    
    return peerConnection;
  }, [state.localStream, state.peerConnections, socket, cleanupPeerConnection]);

  // Create offer for new participant
  const createOfferForPeer = useCallback(async (targetSocketId) => {
    if (!socket || !state.localStream) {
      console.error('Cannot create offer - missing socket or local stream');
      return;
    }

    try {
      console.log('Creating offer for:', targetSocketId);
      
      const peerConnection = createPeerConnection(targetSocketId);
      
      // Create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      await peerConnection.setLocalDescription(offer);
      
      // Send offer
      socket.emit('webrtc:offer', {
        to: targetSocketId,
        offer: offer
      });
      
    } catch (error) {
      console.error('Error creating offer:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [socket, state.localStream, createPeerConnection]);

  // Accept incoming call (handle offer)
  const handleOffer = useCallback(async (fromSocketId, offer) => {
    if (!socket || !state.localStream) {
      console.error('Cannot handle offer - missing socket or local stream');
      return;
    }

    try {
      console.log('Handling offer from:', fromSocketId);
      
      const peerConnection = createPeerConnection(fromSocketId);
      
      // Set remote description
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      // Send answer
      socket.emit('webrtc:answer', {
        to: fromSocketId,
        answer: answer
      });
      
      dispatch({ type: 'SET_CALL_STATUS', payload: 'connected' });
      
    } catch (error) {
      console.error('Error handling offer:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  }, [socket, state.localStream, createPeerConnection]);

  // End all calls and cleanup
  const endAllCalls = useCallback(() => {
    console.log('Ending all calls');
    
    // Close all peer connections
    Object.keys(state.peerConnections).forEach(socketId => {
      cleanupPeerConnection(socketId);
    });
    
    // Stop local stream
    stopLocalStream();
    
    dispatch({ type: 'SET_CALL_STATUS', payload: 'idle' });
  }, [state.peerConnections, cleanupPeerConnection, stopLocalStream]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!state.localStream) return false;
    
    const videoTrack = state.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }, [state.localStream]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!state.localStream) return false;
    
    const audioTrack = state.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }, [state.localStream]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleOfferReceived = async ({ from, offer }) => {
      console.log('Received offer from:', from);
      await handleOffer(from, offer);
    };

    const handleAnswer = async ({ from, answer }) => {
      console.log('Received answer from:', from);
      const peerConnection = state.peerConnections[from];
      if (peerConnection) {
        try {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
          console.error('Error setting remote description:', error);
        }
      }
    };

    const handleIceCandidate = async ({ from, candidate }) => {
      console.log('Received ICE candidate from:', from);
      const peerConnection = state.peerConnections[from];
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
      }
    };

    const handleUserLeft = ({ socketId }) => {
      console.log('User left:', socketId);
      cleanupPeerConnection(socketId);
    };

    // Handle new participant joining
    const handleNewParticipant = ({ socketId }) => {
      console.log('New participant joined:', socketId);
      // Only create offer if we have local stream
      if (state.localStream) {
        // Add small delay to ensure everything is set up
        setTimeout(() => {
          createOfferForPeer(socketId);
        }, 1000);
      }
    };

    socket.on('webrtc:offer', handleOfferReceived);
    socket.on('webrtc:answer', handleAnswer);
    socket.on('webrtc:ice-candidate', handleIceCandidate);
    socket.on('user:left', handleUserLeft);
    socket.on('user:joined', handleNewParticipant);

    return () => {
      socket.off('webrtc:offer', handleOfferReceived);
      socket.off('webrtc:answer', handleAnswer);
      socket.off('webrtc:ice-candidate', handleIceCandidate);
      socket.off('user:left', handleUserLeft);
      socket.off('user:joined', handleNewParticipant);
    };
  }, [socket, isConnected, state.peerConnections, state.localStream, handleOffer, cleanupPeerConnection, createOfferForPeer]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('WebRTC Provider unmounting, cleaning up');
      endAllCalls();
    };
  }, [endAllCalls]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  const contextValue = {
    ...state,
    getUserMedia,
    createOfferForPeer,
    endAllCalls,
    toggleVideo,
    toggleAudio,
    stopLocalStream,
    clearError
  };

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};