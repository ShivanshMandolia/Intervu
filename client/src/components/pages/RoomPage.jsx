// frontend/src/pages/Room.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../context/RoomContext';
import { useWebRTC } from '../../context/WebRTCContext';
import { useAuth } from '../../context/auth/AuthContext';
import VideoCall from '../VideoCall';
import CodeEditor from '../CodeEditor';
import Chat from '../Chat.jsx';
import ParticipantsList from '../ParticipationList.jsx';
import { 
  VideoCameraIcon, 
  MicrophoneIcon, 
  PhoneXMarkIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  UserGroupIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Room context
  const {
    room,
    participants,
    isInRoom,
    error: roomError,
    joinRoom,
    leaveRoom,
    clearError
  } = useRoom();

  // WebRTC context
  const {
    localStream,
    remoteStreams,
    callStatus,
    error: webrtcError,
    isRequestingMedia,
    getUserMedia,
    endAllCalls,
    toggleVideo,
    toggleAudio,
    stopLocalStream,
    clearError: clearWebRTCError
  } = useWebRTC();

  // Local state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [mediaError, setMediaError] = useState(null);

  // Initialize room
  useEffect(() => {
    if (roomId && !isInRoom && user) {
      console.log('Joining room:', roomId);
      joinRoom(roomId);
    }
  }, [roomId, isInRoom, joinRoom, user]);

  // Initialize media when room is joined
  const initializeMedia = useCallback(async () => {
    if (!isInRoom || localStream || isRequestingMedia || mediaInitialized) {
      return;
    }

    console.log('Initializing media...');
    setMediaError(null);
    
    try {
      await getUserMedia({ video: true, audio: true });
      setMediaInitialized(true);
      console.log('Media initialized successfully');
    } catch (error) {
      console.error('Failed to initialize media:', error);
      setMediaError(error.message);
      
      // Try with audio only if video fails
      if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        try {
          console.log('Trying audio-only fallback...');
          await getUserMedia({ video: false, audio: true });
          setMediaInitialized(true);
          setIsVideoEnabled(false);
        } catch (audioError) {
          console.error('Audio-only fallback also failed:', audioError);
          setMediaError('Failed to access microphone. You can still participate in text chat.');
        }
      }
    }
  }, [isInRoom, localStream, isRequestingMedia, mediaInitialized, getUserMedia]);

  useEffect(() => {
    if (isInRoom && !mediaInitialized) {
      // Add a small delay to ensure room is fully set up
      const timer = setTimeout(() => {
        initializeMedia();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isInRoom, mediaInitialized, initializeMedia]);

  // Handle video toggle
  const handleVideoToggle = useCallback(() => {
    if (!localStream) {
      // Try to get media if not available
      initializeMedia();
      return;
    }
    
    const enabled = toggleVideo();
    setIsVideoEnabled(enabled);
  }, [localStream, toggleVideo, initializeMedia]);

  // Handle audio toggle
  const handleAudioToggle = useCallback(() => {
    if (!localStream) {
      // Try to get media if not available
      initializeMedia();
      return;
    }
    
    const enabled = toggleAudio();
    setIsAudioEnabled(enabled);
  }, [localStream, toggleAudio, initializeMedia]);

  // End all calls
  const handleEndCall = useCallback(() => {
    endAllCalls();
    setMediaInitialized(false);
  }, [endAllCalls]);

  // Leave room
  const handleLeaveRoom = useCallback(() => {
    if (callStatus === 'connected') {
      endAllCalls();
    }
    
    // Stop local stream
    stopLocalStream();
    leaveRoom();
    setMediaInitialized(false);
    navigate('/dashboard');
  }, [callStatus, endAllCalls, stopLocalStream, leaveRoom, navigate]);

  // Retry media access
  const retryMediaAccess = useCallback(async () => {
    setMediaError(null);
    setMediaInitialized(false);
    clearWebRTCError();
    
    // Stop existing stream first
    if (localStream) {
      stopLocalStream();
    }
    
    // Wait a bit for cleanup
    setTimeout(() => {
      initializeMedia();
    }, 500);
  }, [clearWebRTCError, localStream, stopLocalStream, initializeMedia]);

  // Clear errors
  const handleClearError = useCallback(() => {
    clearError();
    clearWebRTCError();
    setMediaError(null);
  }, [clearError, clearWebRTCError]);

  // Loading and error states
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <p className="text-red-400">Please log in to access rooms</p>
        </div>
      </div>
    );
  }

  if (roomError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center max-w-md mx-auto p-6">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-400 mb-4">Error: {roomError}</p>
          <button
            onClick={handleClearError}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!isInRoom) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Joining room...</p>
          <p className="mt-2 text-sm text-gray-500">Room ID: {roomId}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold">
            {room?.name || `Room ${roomId}`}
          </h1>
          <span className="text-sm text-gray-400">
            {participants.length + 1} participants
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* View toggles */}
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`p-2 rounded-lg transition-colors ${
              showCodeEditor ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle Code Editor"
          >
            <CodeBracketIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-lg transition-colors ${
              showChat ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle Chat"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-lg transition-colors ${
              showParticipants ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title="Toggle Participants"
          >
            <UserGroupIcon className="h-5 w-5" />
          </button>
          
          <button
            onClick={handleLeaveRoom}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Leave Room
          </button>
        </div>
      </header>

      {/* Error Messages */}
      {(roomError || webrtcError || mediaError) && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span>{roomError || webrtcError || mediaError}</span>
          </div>
          <div className="flex items-center space-x-2">
            {mediaError && (
              <button
                onClick={retryMediaAccess}
                className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 transition-colors text-sm"
                disabled={isRequestingMedia}
              >
                {isRequestingMedia ? 'Retrying...' : 'Retry'}
              </button>
            )}
            <button
              onClick={handleClearError}
              className="text-white hover:text-gray-200 text-xl"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Media initialization status */}
      {isInRoom && !mediaInitialized && !mediaError && (
        <div className="bg-yellow-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>
              {isRequestingMedia ? 'Requesting camera/microphone access...' : 'Initializing media...'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Video Call */}
        <div className="flex-1 flex flex-col">
          <VideoCall
            localStream={localStream}
            remoteStreams={remoteStreams}
            participants={participants}
            mediaInitialized={mediaInitialized}
          />
          
          {/* Video Controls */}
          <div className="bg-gray-800 px-4 py-3 flex items-center justify-center space-x-4">
            <button
              onClick={handleVideoToggle}
              className={`p-3 rounded-full transition-colors ${
                isVideoEnabled && localStream 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
              disabled={isRequestingMedia}
            >
              <VideoCameraIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleAudioToggle}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled && localStream 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
              disabled={isRequestingMedia}
            >
              <MicrophoneIcon className="h-5 w-5" />
            </button>
            
            {callStatus === 'connected' && (
              <button
                onClick={handleEndCall}
                className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
                title="End all calls"
              >
                <PhoneXMarkIcon className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Right Panel - Code Editor */}
        {showCodeEditor && (
          <div className="w-1/2 border-l border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-300">Code Editor</h2>
            </div>
            <div className="flex-1">
              <CodeEditor roomId={roomId} />
            </div>
          </div>
        )}

        {/* Chat Panel */}
        {showChat && (
          <div className="w-80 border-l border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-300">Chat</h2>
            </div>
            <div className="flex-1">
              <Chat roomId={roomId} />
            </div>
          </div>
        )}

        {/* Participants Panel */}
        {showParticipants && (
          <div className="w-64 border-l border-gray-700 flex flex-col">
            <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
              <h2 className="text-sm font-medium text-gray-300">Participants</h2>
            </div>
            <div className="flex-1">
              <ParticipantsList 
                participants={participants} 
                currentUser={user}
                remoteStreams={remoteStreams}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer with room info */}
      <footer className="bg-gray-800 border-t border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center space-x-4">
            <span>Room ID: {roomId}</span>
            <span>Status: {callStatus}</span>
            {localStream && (
              <span className="text-green-400">Media Ready</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {Object.keys(remoteStreams).length > 0 && (
              <span className="text-blue-400">
                {Object.keys(remoteStreams).length} connected
              </span>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Room;