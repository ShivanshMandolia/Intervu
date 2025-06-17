// frontend/src/contexts/WebRTCContext.jsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useRef,
  useEffect,
} from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './auth/AuthContext';

const WebRTCContext = createContext(null);

// Enhanced PeerService class with better error handling
class PeerService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.pendingIceCandidates = [];
    this.isOfferAnswerExchangeComplete = false;
    this.connectionAttempts = 0;
    this.maxConnectionAttempts = 3;
    this.isConnecting = false;
  }

  createPeerConnection() {
    if (this.peer) {
      console.log('🔄 Closing existing peer connection');
      this.peer.close();
    }

    this.peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        },
        {
          urls: 'turn:openrelay.metered.ca:443',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      iceCandidatePoolSize: 10,
    });

    console.log('🔗 New peer connection created');
    this.isOfferAnswerExchangeComplete = false;
    this.pendingIceCandidates = [];
    this.connectionAttempts++;

    return this.peer;
  }

  addLocalStream(stream) {
    if (!this.peer || !stream) {
      console.warn('⚠️ Cannot add stream: peer or stream missing');
      return false;
    }

    console.log('📡 Adding local stream tracks to peer connection');

    try {
      // Remove existing tracks first
      this.peer.getSenders().forEach(sender => {
        if (sender.track) {
          this.peer.removeTrack(sender);
        }
      });

      // Add new tracks
      stream.getTracks().forEach((track) => {
        try {
          console.log('🎵 Adding track:', track.kind, track.id);
          this.peer.addTrack(track, stream);
          console.log('✅ Track added successfully');
        } catch (error) {
          console.error('❌ Failed to add track:', track.kind, error);
        }
      });

      this.localStream = stream;
      console.log(`✅ Successfully added ${stream.getTracks().length} tracks`);
      return true;
    } catch (error) {
      console.error('❌ Error adding local stream:', error);
      return false;
    }
  }

  async createOffer() {
    if (!this.peer) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📤 Creating offer...');
      
      const offer = await this.peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peer.setLocalDescription(offer);
      console.log('📤 Created and set local offer');
      
      return offer;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }

  async createAnswer(offer) {
    if (!this.peer) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📥 Setting remote description and creating answer');
      
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('✅ Remote description set');

      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      
      console.log('📤 Created and set local answer');
      
      this.isOfferAnswerExchangeComplete = true;
      await this.processPendingIceCandidates();
      
      return answer;
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }

  async setRemoteDescription(answer) {
    if (!this.peer) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📥 Setting remote description (answer)');
      await this.peer.setRemoteDescription(new RTCSessionDescription(answer));
      
      this.isOfferAnswerExchangeComplete = true;
      await this.processPendingIceCandidates();
      
      console.log('✅ Remote description set successfully');
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      throw error;
    }
  }

  async addIceCandidate(candidate) {
    if (!this.peer) {
      console.warn('⚠️ Peer connection not ready for ICE candidate');
      return;
    }

    if (!this.isOfferAnswerExchangeComplete) {
      console.log('🧊 Queuing ICE candidate (offer-answer exchange not complete)');
      this.pendingIceCandidates.push(candidate);
      return;
    }

    try {
      await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added successfully');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  }

  async processPendingIceCandidates() {
    if (this.pendingIceCandidates.length === 0) return;
    
    console.log(`🧊 Processing ${this.pendingIceCandidates.length} pending ICE candidates`);
    
    const candidates = [...this.pendingIceCandidates];
    this.pendingIceCandidates = [];
    
    for (const candidate of candidates) {
      try {
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Pending ICE candidate added');
      } catch (error) {
        console.error('❌ Error adding pending ICE candidate:', error);
      }
    }
  }

  canRetryConnection() {
    return this.connectionAttempts < this.maxConnectionAttempts;
  }

  resetConnectionAttempts() {
    this.connectionAttempts = 0;
  }

  close() {
    if (this.peer) {
      console.log('🔌 Closing peer connection');
      this.peer.close();
      this.peer = null;
    }
    
    this.localStream = null;
    this.pendingIceCandidates = [];
    this.isOfferAnswerExchangeComplete = false;
    this.isConnecting = false;
  }
}

const webrtcReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    case 'SET_REMOTE_STREAM':
      return { ...state, remoteStream: action.payload };
    case 'SET_CONNECTION_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_REMOTE_SOCKET_ID':
      return { ...state, remoteSocketId: action.payload };
    case 'SET_IS_INITIATOR':
      return { ...state, isInitiator: action.payload };
    case 'SET_MEDIA_PERMISSIONS':
      return { ...state, mediaPermissions: action.payload };
    case 'SET_DEVICE_ERROR':
      return { ...state, deviceError: action.payload };
    case 'SET_AVAILABLE_DEVICES':
      return { ...state, availableDevices: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
};

const initialState = {
  localStream: null,
  remoteStream: null,
  connectionStatus: 'idle', // idle, connecting, connected, disconnected, failed
  error: null,
  deviceError: null,
  remoteSocketId: null,
  isInitiator: false,
  mediaPermissions: null, // granted, denied, prompt
  availableDevices: { video: [], audio: [] },
};

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
  const peerServiceRef = useRef(new PeerService());
  const isInitializedRef = useRef(false);
  const retryTimeoutRef = useRef(null);
  const mediaInitializationRef = useRef(false);

  // Debug logging helper
  const debugLog = useCallback((message, data = {}) => {
    console.log(`🎥 WebRTC: ${message}`, data);
  }, []);

  // **FIXED: Enhanced device enumeration and validation**
  const checkAvailableDevices = useCallback(async () => {
    try {
      debugLog('Checking available devices...');
      
      // Request permissions first to get device labels
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        tempStream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        debugLog('Permission request failed, continuing with basic check', permError);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      debugLog('Available devices found:', {
        video: videoDevices.length,
        audio: audioDevices.length,
        videoDevices: videoDevices.map(d => ({ id: d.deviceId, label: d.label })),
        audioDevices: audioDevices.map(d => ({ id: d.deviceId, label: d.label }))
      });

      dispatch({
        type: 'SET_AVAILABLE_DEVICES',
        payload: { video: videoDevices, audio: audioDevices }
      });

      return { video: videoDevices, audio: audioDevices };
    } catch (error) {
      console.error('❌ Error checking devices:', error);
      dispatch({
        type: 'SET_DEVICE_ERROR',
        payload: 'DEVICE_ENUMERATION_FAILED'
      });
      return { video: [], audio: [] };
    }
  }, [debugLog]);

  // **FIXED: Enhanced getUserMedia with better device handling**
  const getUserMedia = useCallback(async (constraints = { video: true, audio: true }) => {
    if (mediaInitializationRef.current) {
      debugLog('Media initialization already in progress');
      return state.localStream;
    }

    mediaInitializationRef.current = true;

    try {
      debugLog('Getting user media...', constraints);
      
      // Check available devices first
      const devices = await checkAvailableDevices();
      const hasVideo = devices.video.length > 0;
      const hasAudio = devices.audio.length > 0;
      
      if (!hasVideo && !hasAudio) {
        throw new Error('No camera or microphone devices found');
      }

      // **FIXED: Progressive fallback strategy**
      let stream = null;
      const fallbackStrategies = [
        // Strategy 1: Original constraints
        constraints,
        // Strategy 2: Basic constraints
        { 
          video: hasVideo ? { width: 640, height: 480 } : false, 
          audio: hasAudio 
        },
        // Strategy 3: Audio only
        { 
          video: false, 
          audio: hasAudio 
        },
        // Strategy 4: Video only (if audio fails)
        { 
          video: hasVideo ? { width: 320, height: 240 } : false, 
          audio: false 
        }
      ];

      for (let i = 0; i < fallbackStrategies.length; i++) {
        const strategy = fallbackStrategies[i];
        
        // Skip if strategy requires unavailable devices
        if (strategy.video && !hasVideo) continue;
        if (strategy.audio && !hasAudio) continue;
        if (!strategy.video && !strategy.audio) continue;

        try {
          debugLog(`Trying strategy ${i + 1}:`, strategy);
          stream = await navigator.mediaDevices.getUserMedia(strategy);
          debugLog(`✅ Strategy ${i + 1} successful`);
          break;
        } catch (strategyError) {
          debugLog(`❌ Strategy ${i + 1} failed:`, strategyError.name);
          
          if (i === fallbackStrategies.length - 1) {
            throw strategyError; // Throw the last error if all strategies fail
          }
        }
      }

      if (!stream) {
        throw new Error('All media acquisition strategies failed');
      }

      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      
      debugLog('Stream obtained:', {
        video: videoTracks.length > 0 ? videoTracks[0].label : 'none',
        audio: audioTracks.length > 0 ? audioTracks[0].label : 'none',
        videoEnabled: videoTracks.length > 0 ? videoTracks[0].enabled : false,
        audioEnabled: audioTracks.length > 0 ? audioTracks[0].enabled : false,
      });

      // **FIXED: Add track event listeners for better debugging**
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          debugLog(`Track ended: ${track.kind} - ${track.label}`);
        });
        
        track.addEventListener('mute', () => {
          debugLog(`Track muted: ${track.kind} - ${track.label}`);
        });
        
        track.addEventListener('unmute', () => {
          debugLog(`Track unmuted: ${track.kind} - ${track.label}`);
        });
      });

      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      dispatch({ type: 'SET_MEDIA_PERMISSIONS', payload: 'granted' });
      dispatch({ type: 'CLEAR_ERROR' });
      dispatch({ type: 'SET_DEVICE_ERROR', payload: null });
      
      return stream;
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      
      let errorMessage = 'Failed to access camera/microphone';
      let deviceError = null;

      switch (error.name) {
        case 'NotAllowedError':
          errorMessage = 'Permission denied. Please allow camera/microphone access and refresh the page.';
          deviceError = 'PERMISSION_DENIED';
          dispatch({ type: 'SET_MEDIA_PERMISSIONS', payload: 'denied' });
          break;
        case 'NotFoundError':
          errorMessage = 'No camera/microphone found. Please connect a device and refresh.';
          deviceError = 'NO_DEVICES';
          break;
        case 'NotReadableError':
          errorMessage = 'Camera/microphone is already in use by another tab or application. Please close other tabs or applications using the camera.';
          deviceError = 'DEVICE_IN_USE';
          break;
        case 'OverconstrainedError':
          errorMessage = 'Camera/microphone constraints cannot be satisfied.';
          deviceError = 'CONSTRAINTS_ERROR';
          break;
        case 'AbortError':
          errorMessage = 'Media access was aborted. Please try again.';
          deviceError = 'ABORTED';
          break;
        default:
          errorMessage = `Media access failed: ${error.message}`;
          deviceError = 'UNKNOWN_ERROR';
      }

      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      dispatch({ type: 'SET_DEVICE_ERROR', payload: deviceError });
      throw error;
    } finally {
      mediaInitializationRef.current = false;
    }
  }, [debugLog, checkAvailableDevices, state.localStream]);

  // **FIXED: Enhanced peer connection setup with better error handling**
  const setupPeerConnection = useCallback((peer, targetSocketId) => {
    debugLog('Setting up peer connection handlers for:', targetSocketId);

    // Handle remote stream
    peer.ontrack = (event) => {
      debugLog('Received remote track:', { 
        kind: event.track.kind, 
        streams: event.streams.length,
        trackId: event.track.id,
        trackLabel: event.track.label
      });
      
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        debugLog('Remote stream received with tracks:', 
          remoteStream.getTracks().map((t) => ({ kind: t.kind, id: t.id, label: t.label }))
        );
        dispatch({ type: 'SET_REMOTE_STREAM', payload: remoteStream });
        dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
        peerServiceRef.current.resetConnectionAttempts();
      }
    };

    // Handle ICE candidates
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        debugLog('Sending ICE candidate to:', targetSocketId);
        socket.emit('webrtc:ice-candidate', {
          to: targetSocketId,
          candidate: event.candidate,
        });
      } else if (!event.candidate) {
        debugLog('ICE gathering complete');
      }
    };

    // **FIXED: Enhanced connection state handling**
    peer.onconnectionstatechange = () => {
      const connectionState = peer.connectionState;
      debugLog('Connection state changed:', connectionState);
      
      switch (connectionState) {
        case 'connected':
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
          dispatch({ type: 'CLEAR_ERROR' });
          peerServiceRef.current.isConnecting = false;
          break;
        case 'connecting':
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
          peerServiceRef.current.isConnecting = true;
          break;
        case 'disconnected':
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          peerServiceRef.current.isConnecting = false;
          // **FIXED: Better reconnection logic**
          if (peerServiceRef.current.canRetryConnection() && !peerServiceRef.current.isConnecting) {
            retryTimeoutRef.current = setTimeout(() => {
              debugLog('Attempting to reconnect...');
              startConnection(targetSocketId);
            }, 3000);
          }
          break;
        case 'failed':
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
          dispatch({ type: 'SET_ERROR', payload: 'Connection failed. Please try refreshing the page.' });
          dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
          peerServiceRef.current.isConnecting = false;
          break;
        case 'closed':
          dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
          dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
          peerServiceRef.current.isConnecting = false;
          break;
      }
    };

    // **FIXED: Enhanced ICE connection state handling**
    peer.oniceconnectionstatechange = () => {
      debugLog('ICE connection state:', peer.iceConnectionState);
      
      switch (peer.iceConnectionState) {
        case 'failed':
          if (peerServiceRef.current.canRetryConnection() && !peerServiceRef.current.isConnecting) {
            debugLog('ICE connection failed, attempting restart...');
            peer.restartIce();
          }
          break;
        case 'disconnected':
          debugLog('ICE connection disconnected');
          break;
        case 'connected':
          debugLog('ICE connection established');
          break;
      }
    };

    // **FIXED: Add ICE gathering state handler**
    peer.onicegatheringstatechange = () => {
      debugLog('ICE gathering state:', peer.iceGatheringState);
    };

  }, [socket, debugLog]);

  // **FIXED: Enhanced connection start with better error handling**
  const startConnection = useCallback(async (targetSocketId) => {
    if (peerServiceRef.current.isConnecting) {
      debugLog('Connection already in progress, skipping');
      return;
    }

    debugLog('Starting connection as initiator to:', targetSocketId);
    
    dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: targetSocketId });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
    dispatch({ type: 'SET_IS_INITIATOR', payload: true });

    try {
      peerServiceRef.current.isConnecting = true;
      const peer = peerServiceRef.current.createPeerConnection();
      setupPeerConnection(peer, targetSocketId);

      // **FIXED: Ensure media is available before proceeding**
      let stream = state.localStream;
      if (!stream) {
        debugLog('Getting media for outgoing connection');
        try {
          stream = await getUserMedia();
        } catch (mediaError) {
          debugLog('Failed to get media, proceeding without local stream');
          // Continue without local stream - some connections might work
        }
      }

      // Add stream to peer connection if available
      if (stream) {
        const success = peerServiceRef.current.addLocalStream(stream);
        if (!success) {
          debugLog('Failed to add local stream to peer connection');
        }
      }

      // Create and send offer
      const offer = await peerServiceRef.current.createOffer();
      debugLog('Sending offer to:', targetSocketId);
      
      socket.emit('webrtc:offer', { to: targetSocketId, offer });
      
    } catch (error) {
      console.error('❌ Error starting connection:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to start connection: ${error.message}`,
      });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
      peerServiceRef.current.isConnecting = false;
    }
  }, [socket, state.localStream, getUserMedia, setupPeerConnection, debugLog]);

  // **FIXED: Enhanced offer handling**
  const handleOffer = useCallback(async ({ from, offer }) => {
    if (peerServiceRef.current.isConnecting) {
      debugLog('Already connecting, ignoring offer from:', from);
      return;
    }

    debugLog('Received offer from:', from);
    
    dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: from });
    dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connecting' });
    dispatch({ type: 'SET_IS_INITIATOR', payload: false });

    try {
      peerServiceRef.current.isConnecting = true;
      const peer = peerServiceRef.current.createPeerConnection();
      setupPeerConnection(peer, from);

      // **FIXED: Ensure media is available**
      let stream = state.localStream;
      if (!stream) {
        debugLog('Getting media for incoming connection');
        try {
          stream = await getUserMedia();
        } catch (mediaError) {
          debugLog('Failed to get media, proceeding without local stream');
        }
      }

      // Add stream to peer connection if available
      if (stream) {
        const success = peerServiceRef.current.addLocalStream(stream);
        if (!success) {
          debugLog('Failed to add local stream to peer connection');
        }
      }

      // Create and send answer
      const answer = await peerServiceRef.current.createAnswer(offer);
      debugLog('Sending answer to:', from);
      
      socket.emit('webrtc:answer', { to: from, answer });
      
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      dispatch({
        type: 'SET_ERROR',
        payload: `Failed to handle offer: ${error.message}`,
      });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
      peerServiceRef.current.isConnecting = false;
    }
  }, [state.localStream, getUserMedia, setupPeerConnection, socket, debugLog]);

  // Handle incoming answer
  const handleAnswer = useCallback(async ({ from, answer }) => {
    debugLog('Received answer from:', from);
    
    try {
      await peerServiceRef.current.setRemoteDescription(answer);
      debugLog('Remote description set successfully');
      peerServiceRef.current.isConnecting = false;
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to establish connection' });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'failed' });
      peerServiceRef.current.isConnecting = false;
    }
  }, [debugLog]);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async ({ candidate, from }) => {
    debugLog('Received ICE candidate from:', from);
    
    try {
      await peerServiceRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('❌ ICE candidate error:', error);
    }
  }, [debugLog]);

  // **FIXED: Enhanced user joined handler**
  const handleUserJoined = useCallback(({ socketId, email, userId, user: joinedUser }) => {
    debugLog('User joined:', { socketId, email, userId });
    
    if (socketId === socket?.id) {
      debugLog('Ignoring self join');
      return;
    }

    // **FIXED: Only auto-start if not already connecting/connected**
    if (state.connectionStatus === 'idle' || state.connectionStatus === 'disconnected') {
      debugLog('Auto-starting connection to new user');
      // Add small delay to ensure both users are ready
      setTimeout(() => {
        startConnection(socketId);
      }, 1000);
    } else {
      debugLog('Already connecting/connected, not starting new connection');
    }
  }, [socket, state.connectionStatus, startConnection, debugLog]);

  // Handle user left
  const handleUserLeft = useCallback(({ socketId, email, userId }) => {
    debugLog('User left:', { socketId, email, userId });
    
    if (socketId === state.remoteSocketId) {
      debugLog('Remote user left - cleaning up connection');
      peerServiceRef.current.close();
      dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'idle' });
      dispatch({ type: 'SET_REMOTE_SOCKET_ID', payload: null });
      dispatch({ type: 'SET_IS_INITIATOR', payload: false });
    }
  }, [state.remoteSocketId, debugLog]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (!state.localStream) {
      dispatch({ type: 'SET_ERROR', payload: 'No local stream available' });
      return false;
    }
    
    const videoTracks = state.localStream.getVideoTracks();
    if (videoTracks.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No video device available' });
      return false;
    }
    
    const enabled = !videoTracks[0].enabled;
    videoTracks[0].enabled = enabled;
    debugLog('Video toggled:', enabled ? 'ON' : 'OFF');
    dispatch({ type: 'CLEAR_ERROR' });
    return enabled;
  }, [state.localStream, debugLog]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (!state.localStream) {
      dispatch({ type: 'SET_ERROR', payload: 'No local stream available' });
      return false;
    }
    const audioTracks = state.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'No audio device available' });
      return false;
    }
    const enabled = !audioTracks[0].enabled;
    audioTracks[0].enabled = enabled;
    debugLog('Audio toggled:', enabled ? 'ON' : 'OFF');
    dispatch({ type: 'CLEAR_ERROR' });
    return enabled;
  }, [state.localStream, debugLog]);

  // Retry connection
  const retryConnection = useCallback(() => {
    if (state.remoteSocketId && !peerServiceRef.current.isConnecting) {
      debugLog('Retrying connection...');
      peerServiceRef.current.resetConnectionAttempts();
      startConnection(state.remoteSocketId);
    }
  }, [state.remoteSocketId, startConnection, debugLog]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
    dispatch({ type: 'SET_DEVICE_ERROR', payload: null });
  }, []);

  // **FIXED: Initialize media on mount with better timing**
  useEffect(() => {
    if (!state.localStream && !state.deviceError && !mediaInitializationRef.current) {
      // Add delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        getUserMedia().catch(error => {
          console.error('Failed to initialize media:', error);
        });
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [getUserMedia, state.localStream, state.deviceError]);
   useEffect(() => {
    if (!socket || !isConnected || isInitializedRef.current) return;
    
    console.log('🎧 Setting up WebRTC socket listeners');
    isInitializedRef.current = true;

    const listeners = {
      'user:joined': handleUserJoined,
      'webrtc:offer': handleOffer,
      'webrtc:answer': handleAnswer,
      'webrtc:ice-candidate': handleIceCandidate,
      'user:left': handleUserLeft,
    };

    Object.entries(listeners).forEach(([event, handler]) => {
      socket.on(event, handler);
      console.log(`📡 Registered listener for: ${event}`);
    });

    return () => {
      console.log('🔇 Cleaning up WebRTC socket listeners');
      Object.entries(listeners).forEach(([event, handler]) => {
        socket.off(event, handler);
      });
      isInitializedRef.current = false;
    };
  }, [
    socket,
    isConnected,
    handleUserJoined,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    handleUserLeft,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 WebRTC Provider unmounting - cleaning up');
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (state.localStream) {
        state.localStream.getTracks().forEach((track) => {
          track.stop();
          console.log('🛑 Cleanup: Stopped track:', track.kind);
        });
      }
      peerServiceRef.current?.close();
      mediaInitializationRef.current = false;
    };
  }, []);

  // Context value
  const contextValue = React.useMemo(
    () => ({
      // State
      localStream: state.localStream,
      remoteStream: state.remoteStream,
      connectionStatus: state.connectionStatus,
      error: state.error,
      deviceError: state.deviceError,
      remoteSocketId: state.remoteSocketId,
      isInitiator: state.isInitiator,
      mediaPermissions: state.mediaPermissions,
      availableDevices: state.availableDevices,
      
      // Actions
      getUserMedia,
      startConnection,
      toggleVideo,
      toggleAudio,
      retryConnection,
      clearError,
      checkAvailableDevices,
    }),
    [
      state.localStream,
      state.remoteStream,
      state.connectionStatus,
      state.error,
      state.deviceError,
      state.remoteSocketId,
      state.isInitiator,
      state.mediaPermissions,
      state.availableDevices,
      getUserMedia,
      startConnection,
      toggleVideo,
      toggleAudio,
      retryConnection,
      clearError,
      checkAvailableDevices,
    ]
  );

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};

export default WebRTCProvider;