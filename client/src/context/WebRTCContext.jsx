// frontend/src/context/WebRTCContext.jsx - ENHANCED WITH TEST MODE
import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './auth/AuthContext';

const WebRTCContext = createContext(null);

// Enhanced peer service class
/ Enhanced peer service class with modern WebRTC APIs
class PeerService {
  constructor() {
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.pendingIceCandidates = [];
  }

  createPeerConnection() {
    if (this.peer) {
      this.peer.close();
    }

    this.peer = new RTCPeerConnection({
      iceServers: [
        {
          urls: [
            "stun:stun.l.google.com:19302",
            "stun:global.stun.twilio.com:3478",
          ],
        },
      ],
    });

    console.log('🔗 New peer connection created');
    
    // Set up connection state monitoring
    this.peer.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', this.peer.connectionState);
    };

    this.peer.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', this.peer.iceConnectionState);
    };

    return this.peer;
  }

  // FIXED: Use addTrack instead of deprecated addStream
  addLocalStream(stream) {
    if (!this.peer || !stream) {
      console.warn('⚠️ Cannot add stream: peer or stream missing');
      return;
    }

    console.log('📡 Adding local stream tracks to peer connection');
    
    // Remove existing tracks first
    const senders = this.peer.getSenders();
    senders.forEach(sender => {
      if (sender.track) {
        this.peer.removeTrack(sender);
        console.log('🗑️ Removed existing track:', sender.track.kind);
      }
    });

    // Add new tracks
    stream.getTracks().forEach(track => {
      console.log('🎵 Adding track:', track.kind, track.id, track.label);
      const sender = this.peer.addTrack(track, stream);
      console.log('✅ Track added successfully, sender:', sender);
    });

    this.localStream = stream;
  }

  // FIXED: Enhanced offer creation with proper constraints
  async getOffer() {
    if (!this.peer) {
      throw new Error('Peer connection not initialized');
    }

    try {
      const offer = await this.peer.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await this.peer.setLocalDescription(offer);
      console.log('📤 Created and set local offer:', offer.type);
      return offer;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }

  // FIXED: Enhanced answer creation
  async getAnswer(offer) {
    if (!this.peer) {
      throw new Error('Peer connection not initialized');
    }

    try {
      console.log('📥 Setting remote description and creating answer');
      await this.peer.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await this.peer.createAnswer();
      await this.peer.setLocalDescription(answer);
      
      console.log('📤 Created and set local answer:', answer.type);
      
      // Process any pending ICE candidates
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
      
      // Process any pending ICE candidates
      await this.processPendingIceCandidates();
      
      console.log('✅ Remote description set successfully');
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      throw error;
    }
  }

  // FIXED: Better ICE candidate handling
  async addIceCandidate(candidate) {
    if (!this.peer) {
      console.warn('⚠️ Peer connection not ready for ICE candidate');
      return;
    }

    if (!this.peer.remoteDescription) {
      console.log('🧊 Queuing ICE candidate (no remote description yet)');
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
    
    for (const candidate of this.pendingIceCandidates) {
      try {
        await this.peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ Pending ICE candidate added');
      } catch (error) {
        console.error('❌ Error adding pending ICE candidate:', error);
      }
    }
    
    this.pendingIceCandidates = [];
  }

  close() {
    if (this.peer) {
      console.log('🔌 Closing peer connection');
      this.peer.close();
      this.peer = null;
    }
    this.localStream = null;
    this.remoteStream = null;
    this.pendingIceCandidates = [];
  }
}

const webrtcReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOCAL_STREAM':
      return { ...state, localStream: action.payload };
    
    case 'SET_REMOTE_STREAM':
      return { ...state, remoteStream: action.payload };
    
    case 'SET_CALL_STATUS':
      return { ...state, callStatus: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    case 'SET_DEVICE_STATUS':
      return { ...state, deviceStatus: action.payload };
    
    case 'SET_TEST_MODE':
      return { ...state, isTestMode: action.payload };
    
    case 'RESET':
      return { ...initialState };
    
    default:
      return state;
  }
};

const initialState = {
  localStream: null,
  remoteStream: null,
  callStatus: 'idle', // idle, connecting, connected
  error: null,
  deviceStatus: { hasVideo: false, hasAudio: false, isChecking: true },
  isTestMode: false,
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
  const currentRoomRef = useRef(null);
  const remoteSocketIdRef = useRef(null);
  const isInitializedRef = useRef(false);
  const mediaRetryCount = useRef(0);
  const maxRetries = 3;
  const testCanvasRef = useRef(null);
  const testAnimationRef = useRef(null);

  // Detect test mode
  const detectTestMode = useCallback(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const hasTestParam = window.location.search.includes('test=true');
    const isTestMode = isDev && hasTestParam;
    
    if (isTestMode !== state.isTestMode) {
      dispatch({ type: 'SET_TEST_MODE', payload: isTestMode });
      console.log('🧪 Test mode:', isTestMode ? 'ENABLED' : 'DISABLED');
    }
    
    return isTestMode;
  }, [state.isTestMode]);

  // Create fake video stream for testing
  const createTestVideoStream = useCallback((label = 'Test User', color = null) => {
    console.log('🧪 Creating test video stream:', label);
    
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    
    // Store canvas reference for cleanup
    testCanvasRef.current = canvas;
    
    // Generate random color if not provided
    let hue = color || Math.random() * 360;
    
    const animate = () => {
      hue = (hue + 1) % 360;
      
      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, `hsl(${hue}, 70%, 40%)`);
      gradient.addColorStop(1, `hsl(${(hue + 60) % 360}, 70%, 60%)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Animated circles
      const time = Date.now() * 0.001;
      for (let i = 0; i < 5; i++) {
        const x = canvas.width/2 + Math.cos(time + i) * 100;
        const y = canvas.height/2 + Math.sin(time + i * 0.7) * 80;
        const radius = 20 + Math.sin(time * 2 + i) * 10;
        
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${(hue + i * 72) % 360}, 80%, 80%, 0.3)`;
        ctx.fill();
      }
      
      // User label
      ctx.fillStyle = 'white';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.strokeText(label, canvas.width/2, canvas.height/2 - 40);
      ctx.fillText(label, canvas.width/2, canvas.height/2 - 40);
      
      // Time display
      ctx.font = '24px Arial';
      const timeStr = new Date().toLocaleTimeString();
      ctx.strokeText(timeStr, canvas.width/2, canvas.height/2 + 20);
      ctx.fillText(timeStr, canvas.width/2, canvas.height/2 + 20);
      
      // Test mode indicator
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#ff6b6b';
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 1;
      ctx.strokeText('🧪 TEST MODE', canvas.width/2, canvas.height - 30);
      ctx.fillText('🧪 TEST MODE', canvas.width/2, canvas.height - 30);
      
      testAnimationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Create fake audio track using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Create very quiet tone so it doesn't disturb
    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    oscillator.start();
    
    // Get the destination as a MediaStream
    const destination = audioContext.createMediaStreamDestination();
    gainNode.connect(destination);
    
    // Combine video and audio streams
    const videoStream = canvas.captureStream(30);
    const audioStream = destination.stream;
    
    const combinedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...audioStream.getAudioTracks()
    ]);
    
    console.log('✅ Test stream created with tracks:', combinedStream.getTracks().map(t => `${t.kind}: ${t.label || 'unlabeled'}`));
    
    return combinedStream;
  }, []);

  // Cleanup test stream
  const cleanupTestStream = useCallback(() => {
    if (testAnimationRef.current) {
      cancelAnimationFrame(testAnimationRef.current);
      testAnimationRef.current = null;
    }
    testCanvasRef.current = null;
  }, []);

  // Check available media devices
  const checkMediaDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasVideo = devices.some(device => device.kind === 'videoinput');
      const hasAudio = devices.some(device => device.kind === 'audioinput');
      
      console.log('📱 Media devices available:', {
        videoInputs: devices.filter(d => d.kind === 'videoinput').length,
        audioInputs: devices.filter(d => d.kind === 'audioinput').length,
        hasVideo,
        hasAudio
      });
      
      dispatch({ 
        type: 'SET_DEVICE_STATUS', 
        payload: { hasVideo, hasAudio, isChecking: false } 
      });
      
      if (!hasVideo && !hasAudio) {
        dispatch({ type: 'SET_ERROR', payload: 'No media devices detected' });
      }
      
      return { hasVideo, hasAudio };
    } catch (error) {
      console.error('❌ Device enumeration error:', error);
      dispatch({ 
        type: 'SET_DEVICE_STATUS', 
        payload: { hasVideo: false, hasAudio: false, isChecking: false } 
      });
      return { hasVideo: false, hasAudio: false };
    }
  }, []);

  // Enhanced getUserMedia with test mode support
  const getUserMedia = useCallback(async (forceRetry = false) => {
    try {
      console.log('📱 Getting user media...');
      
      const isTestMode = detectTestMode();
      
      // Check if in test mode (add ?test=true to URL)
      if (isTestMode) {
        console.log('🧪 Test mode enabled - using fake video stream');
        const testStream = createTestVideoStream(`User ${Math.floor(Math.random() * 100)}`, Math.random() * 360);
        dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
        dispatch({ type: 'CLEAR_ERROR' });
        return testStream;
      }
      
      if (!forceRetry && mediaRetryCount.current >= maxRetries) {
        // Fallback to test mode if max retries reached
        console.log('🧪 Max retries reached - using test mode');
        const testStream = createTestVideoStream('Test User (Fallback)', 0);
        dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
        dispatch({ type: 'SET_ERROR', payload: 'Max retries reached. Using test mode. Add ?test=true to URL for intentional test mode.' });
        return testStream;
      }
      
      if (forceRetry) {
        mediaRetryCount.current = 0;
      }
      
      const { hasVideo, hasAudio } = await checkMediaDevices();
      
      if (!hasVideo && !hasAudio) {
        throw new Error('No media devices available');
      }
      
      let stream;
      const constraints = [];
      
      // Strategy 1: Try video + audio
      if (hasVideo && hasAudio) {
        constraints.push({ video: true, audio: true });
      }
      
      // Strategy 2: Try audio only  
      if (hasAudio) {
        constraints.push({ audio: true });
      }
      
      // Strategy 3: Try video only
      if (hasVideo) {
        constraints.push({ video: true });
      }
      
      let lastError;
      for (const constraint of constraints) {
        try {
          console.log('🎯 Trying constraint:', constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log('✅ Successfully got stream');
          break;
        } catch (error) {
          console.warn('⚠️ Constraint failed:', constraint, error);
          lastError = error;
          
          // Special handling for "already in use" error
          if (error.name === 'NotReadableError' || error.message.includes('already in use')) {
            console.log('🧪 Device busy - offering test mode fallback');
            const testStream = createTestVideoStream('Test User (Device Busy)', 120);
            dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
            dispatch({ type: 'SET_ERROR', payload: 'Camera busy. Using test mode. Try different browser or incognito mode for real camera, or add ?test=true to URL.' });
            return testStream;
          }
          
          mediaRetryCount.current++;
          continue;
        }
      }
      
      if (!stream) {
        // Final fallback to test mode
        console.log('🧪 All constraints failed - using test mode');
        const testStream = createTestVideoStream('Test User (Fallback)', 240);
        dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
        dispatch({ type: 'SET_ERROR', payload: 'Could not access camera. Using test mode for development. Add ?test=true to URL for intentional test mode.' });
        return testStream;
      }
      
      // Log what we got
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();
      console.log('📊 Real stream info:', {
        video: videoTracks.length > 0 ? videoTracks[0].label : 'none',
        audio: audioTracks.length > 0 ? audioTracks[0].label : 'none'
      });
      
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      dispatch({ type: 'CLEAR_ERROR' });
      mediaRetryCount.current = 0;
      
      return stream;
      
    } catch (error) {
      console.error('❌ Error getting user media:', error);
      
      // Always fallback to test mode in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 Development fallback to test mode');
        const testStream = createTestVideoStream('Test User (Error Fallback)', 300);
        dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
        dispatch({ type: 'SET_ERROR', payload: `Media error: ${error.message}. Using test mode. Add ?test=true to URL for intentional test mode.` });
        return testStream;
      }
      
      let errorMessage = 'Failed to access media devices';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permission denied. Please allow camera/microphone access and refresh.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please connect a device.';
      } else if (error.name === 'NotReadableError' || error.message.includes('already in use')) {
        errorMessage = 'Camera/microphone busy. Try: 1) Different browser 2) Incognito mode 3) Close other tabs using camera 4) Add ?test=true for test mode';
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [checkMediaDevices, detectTestMode, createTestVideoStream]);

  // Device switching capability
  const switchCamera = useCallback(async (deviceId) => {
    try {
      if (state.isTestMode) {
        console.log('🧪 Switching test camera');
        const testStream = createTestVideoStream(`Camera ${deviceId.slice(-4)}`, Math.random() * 360);
        
        // Replace in peer connection if exists
        if (peerServiceRef.current.peer && state.localStream) {
          const videoTrack = testStream.getVideoTracks()[0];
          const sender = peerServiceRef.current.peer.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        // Stop old stream
        if (state.localStream) {
          state.localStream.getTracks().forEach(track => track.stop());
        }
        
        dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: true
      });
      
      // Replace video track in peer connection
      if (peerServiceRef.current.peer && state.localStream) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peerServiceRef.current.peer.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }
      }
      
      // Stop old stream
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      
      dispatch({ type: 'SET_LOCAL_STREAM', payload: stream });
      
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to switch camera' });
    }
  }, [state.localStream, state.isTestMode, createTestVideoStream]);

  // Toggle test mode manually
  const toggleTestMode = useCallback(() => {
    const newTestMode = !state.isTestMode;
    dispatch({ type: 'SET_TEST_MODE', payload: newTestMode });
    
    if (newTestMode) {
      // Switch to test mode
      console.log('🧪 Switching to test mode');
      const testStream = createTestVideoStream('Manual Test Mode', 180);
      
      // Stop current stream
      if (state.localStream) {
        state.localStream.getTracks().forEach(track => track.stop());
      }
      
      dispatch({ type: 'SET_LOCAL_STREAM', payload: testStream });
      dispatch({ type: 'CLEAR_ERROR' });
    } else {
      // Switch back to real camera
      console.log('📱 Switching back to real camera');
      cleanupTestStream();
      getUserMedia(true);
    }
  }, [state.isTestMode, state.localStream, createTestVideoStream, cleanupTestStream, getUserMedia]);

  // Setup remote stream handler
  const setupRemoteStreamHandler = useCallback((peer) => {
    peer.ontrack = (event) => {
      console.log('📥 Received remote track:', event.track.kind);
      
      if (event.streams && event.streams.length > 0) {
        const remoteStream = event.streams[0];
        console.log('✅ Remote stream received with tracks:', remoteStream.getTracks().map(t => t.kind));
        dispatch({ type: 'SET_REMOTE_STREAM', payload: remoteStream });
        dispatch({ type: 'SET_CALL_STATUS', payload: 'connected' });
      }
    };
  }, []);

  // Setup ICE candidate handler
  const setupIceCandidateHandler = useCallback((peer, targetSocketId) => {
    peer.onicecandidate = (event) => {
      if (event.candidate && socket) {
        console.log('🧊 Sending ICE candidate to:', targetSocketId);
        socket.emit('webrtc:ice-candidate', {
          to: targetSocketId,
          candidate: event.candidate
        });
      } else if (!event.candidate) {
        console.log('🧊 ICE gathering complete');
      }
    };
  }, [socket]);

  // Setup connection state handler
  const setupConnectionStateHandler = useCallback((peer) => {
    peer.onconnectionstatechange = () => {
      const state = peer.connectionState;
      console.log('🔗 Connection state changed:', state);
      
      switch (state) {
        case 'connected':
          dispatch({ type: 'SET_CALL_STATUS', payload: 'connected' });
          break;
        case 'connecting':
          dispatch({ type: 'SET_CALL_STATUS', payload: 'connecting' });
          break;
        case 'disconnected':
        case 'failed':
        case 'closed':
          dispatch({ type: 'SET_CALL_STATUS', payload: 'idle' });
          dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
          break;
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peer.iceConnectionState);
    };
  }, []);

  // Enhanced handle user joined with better error handling
  const handleUserJoined = useCallback(async ({ socketId, email, userId, user: joinedUser }) => {
    console.log('👋 User joined - initiating call:', { socketId, email, userId });
    
    if (socketId === socket?.id) {
      console.log('🚫 Ignoring self join');
      return;
    }
    
    remoteSocketIdRef.current = socketId;
    dispatch({ type: 'SET_CALL_STATUS', payload: 'connecting' });
    
    try {
      // Create peer connection first
      const peer = peerServiceRef.current.createPeerConnection();
      
      // Setup event handlers
      setupRemoteStreamHandler(peer);
      setupIceCandidateHandler(peer, socketId);
      setupConnectionStateHandler(peer);
      
      // Try to get local stream
      let stream = state.localStream;
      if (!stream) {
        try {
          console.log('📱 Getting media for outgoing call');
          stream = await getUserMedia();
        } catch (mediaError) {
          console.warn('⚠️ Proceeding without local media:', mediaError);
          // Continue with call even without local media - user can still receive
          // Don't dispatch error here as it's already handled in getUserMedia
        }
      }
      
      // Add local stream if available
      if (stream) {
        peerServiceRef.current.addStream(stream);
      }
      
      // Create and send offer
      const offer = await peerServiceRef.current.getOffer();
      console.log('📞 Calling user:', socketId);
      socket.emit('user:call', { to: socketId, offer });
      
    } catch (error) {
      console.error('❌ Error in handleUserJoined:', error);
      if (!error.message.includes('already in use') && !error.message.includes('denied')) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to initiate call: ${error.message}` });
      }
      dispatch({ type: 'SET_CALL_STATUS', payload: 'idle' });
    }
  }, [socket, state.localStream, getUserMedia, setupRemoteStreamHandler, setupIceCandidateHandler, setupConnectionStateHandler]);

  // Enhanced handle incoming call
  const handleIncomingCall = useCallback(async ({ from, offer, caller }) => {
    console.log('📞 Incoming call from:', from, caller);
    
    remoteSocketIdRef.current = from;
    dispatch({ type: 'SET_CALL_STATUS', payload: 'connecting' });
    
    try {
      // Create peer connection first
      const peer = peerServiceRef.current.createPeerConnection();
      
      // Setup event handlers
      setupRemoteStreamHandler(peer);
      setupIceCandidateHandler(peer, from);
      setupConnectionStateHandler(peer);
      
      // Try to get local stream
      let stream = state.localStream;
      if (!stream) {
        try {
          console.log('📱 Getting media for incoming call');
          stream = await getUserMedia();
        } catch (mediaError) {
          console.warn('⚠️ Proceeding without local media:', mediaError);
          // Continue with call even without local media - user can still receive
        }
      }
      
      // Add local stream if available
      if (stream) {
        peerServiceRef.current.addStream(stream);
      }
      
      // Create and send answer
      const answer = await peerServiceRef.current.getAnswer(offer);
      console.log('✅ Answering call from:', from);
      socket.emit('call:accepted', { to: from, answer });
      
    } catch (error) {
      console.error('❌ Error handling incoming call:', error);
      if (!error.message.includes('already in use') && !error.message.includes('denied')) {
        dispatch({ type: 'SET_ERROR', payload: `Failed to answer call: ${error.message}` });
      }
      dispatch({ type: 'SET_CALL_STATUS', payload: 'idle' });
    }
  }, [socket, state.localStream, getUserMedia, setupRemoteStreamHandler, setupIceCandidateHandler, setupConnectionStateHandler]);

  // Handle call accepted
  const handleCallAccepted = useCallback(async ({ answer, from, accepter }) => {
    console.log('✅ Call accepted by:', from, accepter);
    try {
      await peerServiceRef.current.setRemoteDescription(answer);
      console.log('✅ Remote description set successfully');
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to establish connection' });
    }
  }, []);

  // Handle ICE candidate
  const handleIceCandidate = useCallback(async ({ candidate, from }) => {
    console.log('🧊 Received ICE candidate from:', from);
    const peer = peerServiceRef.current.peer;
    
    if (peer && peer.remoteDescription && candidate) {
      try {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added successfully');
      } catch (error) {
        console.error('❌ ICE candidate error:', error);
        // Don't throw - ICE failures are often recoverable
      }
    } else {
      console.warn('⚠️ Peer not ready for ICE candidate or no candidate provided');
    }
  }, []);

  // Handle user left
  const handleUserLeft = useCallback(({ socketId, email, userId }) => {
    console.log('👋 User left:', { socketId, email, userId });
    if (socketId === remoteSocketIdRef.current) {
      console.log('🔌 Remote user left - cleaning up connection');
      peerServiceRef.current.close();
      dispatch({ type: 'SET_REMOTE_STREAM', payload: null });
      dispatch({ type: 'SET_CALL_STATUS', payload: 'idle' });
      remoteSocketIdRef.current = null;
    }
  }, []);

  // End call
  const endCall = useCallback(() => {
    console.log('📞 Ending call');
    peerServiceRef.current.close();
    
    // Stop local stream tracks
    const currentLocalStream = state.localStream;
    if (currentLocalStream) {
      currentLocalStream.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }
    
    cleanupTestStream();
    dispatch({ type: 'RESET' });
    remoteSocketIdRef.current = null;
    mediaRetryCount.current = 0;
  }, [state.localStream, cleanupTestStream]);

  // Enhanced toggle video with better error handling
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
    console.log('📹 Video toggled:', enabled ? 'ON' : 'OFF');
    dispatch({ type: 'CLEAR_ERROR' });
    return enabled;
  }, [state.localStream]);

  // Enhanced toggle audio with better error handling
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
    console.log('🎤 Audio toggled:', enabled ? 'ON' : 'OFF');
    dispatch({ type: 'CLEAR_ERROR' });
    return enabled;
  }, [state.localStream]);
  // Retry media access
  const retryMediaAccess = useCallback(async () => {
    try {
      mediaRetryCount.current = 0;
      dispatch({ type: 'CLEAR_ERROR' });
      await getUserMedia(true);
    } catch (error) {
      console.error('❌ Retry failed:', error);
      // Error is already handled in getUserMedia
    }
  }, [getUserMedia]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, []);

  // Check media devices on mount
  useEffect(() => {
    checkMediaDevices();
  }, [checkMediaDevices]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !isConnected || isInitializedRef.current) return;

    console.log('🎧 Setting up WebRTC socket listeners');
    isInitializedRef.current = true;

    const listeners = {
      'user:joined': handleUserJoined,
      'incoming:call': handleIncomingCall,
      'call:accepted': handleCallAccepted,
      'webrtc:ice-candidate': handleIceCandidate,
      'user:left': handleUserLeft
    };

    // Set up listeners
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
  }, [socket, isConnected, handleUserJoined, handleIncomingCall, handleCallAccepted, handleIceCandidate, handleUserLeft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log('🧹 WebRTC Provider unmounting - cleaning up');
      const currentLocalStream = state.localStream;
      if (currentLocalStream) {
        currentLocalStream.getTracks().forEach(track => {
          track.stop();
          console.log('🛑 Cleanup: Stopped track:', track.kind);
        });
      }
      peerServiceRef.current?.close();
    };
  }, []);

  // Memoize context value
  const contextValue = React.useMemo(() => ({
    localStream: state.localStream,
    remoteStream: state.remoteStream,
    callStatus: state.callStatus,
    error: state.error,
    deviceStatus: state.deviceStatus,
    remoteSocketId: remoteSocketIdRef.current,
    getUserMedia,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError,
    retryMediaAccess,
    checkMediaDevices,
  }), [
    state.localStream,
    state.remoteStream,
    state.callStatus,
    state.error,
    state.deviceStatus,
    getUserMedia,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError,
    retryMediaAccess,
    checkMediaDevices
  ]);

  return (
    <WebRTCContext.Provider value={contextValue}>
      {children}
    </WebRTCContext.Provider>
  );
};