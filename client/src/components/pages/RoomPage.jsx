import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom } from '../../context/RoomContext'; // Fixed import path
import { useWebRTC } from '../../context/WebRTCContext'; // Fixed import path
import { useAuth } from '../../context/auth/AuthContext';
import CodeEditor from '../CodeEditor'; // Updated import path
import Chat from '../Chat.jsx'; // Updated import path
import ParticipantsList from '../ParticipationList.jsx'; // Updated import path
import { 
  VideoCameraIcon, 
  MicrophoneIcon, 
  PhoneXMarkIcon,
  ChatBubbleLeftIcon,
  CodeBracketIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

// Enhanced VideoCall component with better layout
// Enhanced VideoCall component with better audio handling
const VideoCall = ({ localStream, remoteStream, callStatus }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showRemotePlayButton, setShowRemotePlayButton] = useState(false);
  const [showLocalPlayButton, setShowLocalPlayButton] = useState(false);
  const [isLocalVideoMinimized, setIsLocalVideoMinimized] = useState(false);
  const isMountedRef = useRef(true);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // **FIXED: Enhanced playback handling with better audio support**
  const handlePlay = useCallback(async (element, isRemote = false) => {
    if (!element || !isMountedRef.current) return;
    
    if (!element.isConnected) {
      console.warn('Video element not in DOM, skipping play');
      return;
    }

    try {
      // **FIXED: Better readiness check**
      if (element.readyState < 2) {
        console.log(`${isRemote ? 'Remote' : 'Local'} video not ready (readyState: ${element.readyState}), waiting...`);
        
        return new Promise((resolve) => {
          let resolved = false;
          
          const handleCanPlay = async () => {
            if (resolved) return;
            resolved = true;
            
            element.removeEventListener('canplay', handleCanPlay);
            element.removeEventListener('loadeddata', handleCanPlay);
            
            if (isMountedRef.current && element.isConnected) {
              try {
                console.log(`${isRemote ? 'Remote' : 'Local'} video ready, attempting play`);
                await element.play();
                if (isRemote) setShowRemotePlayButton(false);
                else setShowLocalPlayButton(false);
                console.log(`${isRemote ? 'Remote' : 'Local'} video playing successfully`);
              } catch (error) {
                console.warn(`${isRemote ? 'Remote' : 'Local'} autoplay prevented:`, error);
                if (isRemote) setShowRemotePlayButton(true);
                else setShowLocalPlayButton(true);
              }
            }
            resolve();
          };
          
          // Listen for both events
          element.addEventListener('canplay', handleCanPlay);
          element.addEventListener('loadeddata', handleCanPlay);
          
          // Timeout fallback
          setTimeout(() => {
            if (!resolved) {
              console.warn(`${isRemote ? 'Remote' : 'Local'} video timeout, forcing play attempt`);
              handleCanPlay();
            }
          }, 5000);
        });
      } else {
        console.log(`${isRemote ? 'Remote' : 'Local'} video ready, playing immediately`);
        await element.play();
        if (isRemote) setShowRemotePlayButton(false);
        else setShowLocalPlayButton(false);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.warn(`${isRemote ? 'Remote' : 'Local'} autoplay prevented:`, error);
        if (isRemote) setShowRemotePlayButton(true);
        else setShowLocalPlayButton(true);
      }
    }
  }, []);

  // Manual play handlers
  const handleManualPlayRemote = useCallback(async () => {
    if (!remoteVideoRef.current || !isMountedRef.current) return;
    
    try {
      console.log('Manual remote play triggered');
      await remoteVideoRef.current.play();
      setShowRemotePlayButton(false);
      console.log('Manual remote play successful');
    } catch (error) {
      console.error('Manual remote play failed:', error);
    }
  }, []);

  const handleManualPlayLocal = useCallback(async () => {
    if (!localVideoRef.current || !isMountedRef.current) return;
    
    try {
      console.log('Manual local play triggered');
      await localVideoRef.current.play();
      setShowLocalPlayButton(false);
      console.log('Manual local play successful');
    } catch (error) {
      console.error('Manual local play failed:', error);
    }
  }, []);

  // **FIXED: Enhanced local video stream handling**
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (!videoElement || !localStream || !isMountedRef.current) return;

    console.log('🎥 Setting local video stream', {
      tracks: localStream.getTracks().map(t => ({ kind: t.kind, enabled: t.enabled })),
      streamId: localStream.id
    });
    
    if (videoElement.srcObject !== localStream) {
      videoElement.srcObject = localStream;
      
      // **FIXED: Ensure local video is muted to prevent feedback**
      videoElement.muted = true;
      videoElement.volume = 0;
      
      const timer = setTimeout(() => {
        if (isMountedRef.current && videoElement.isConnected) {
          handlePlay(videoElement, false);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [localStream, handlePlay]);

  // **FIXED: Enhanced remote video stream handling with proper audio**
  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (!videoElement || !remoteStream || !isMountedRef.current) return;

    console.log('🎥 Setting remote video stream', {
      tracks: remoteStream.getTracks().map(t => ({ 
        kind: t.kind, 
        enabled: t.enabled, 
        muted: t.muted,
        readyState: t.readyState 
      })),
      streamId: remoteStream.id
    });
    
    if (videoElement.srcObject !== remoteStream) {
      videoElement.srcObject = remoteStream;
      
      // **FIXED: Critical - Ensure remote video audio is enabled**
      videoElement.muted = false;
      videoElement.volume = 1.0;
      
      // **FIXED: Set additional audio properties**
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      
      // **FIXED: Add comprehensive event listeners for debugging**
      const handleLoadStart = () => console.log('🎥 Remote video: loadstart');
      const handleLoadedMetadata = () => {
        console.log('🎥 Remote video: loadedmetadata');
        console.log('🔊 Remote video audio properties:', {
          muted: videoElement.muted,
          volume: videoElement.volume,
          hasAudio: remoteStream.getAudioTracks().length > 0
        });
      };
      const handleLoadedData = () => {
        console.log('🎥 Remote video: loadeddata');
        // Double-check audio settings
        videoElement.muted = false;
        videoElement.volume = 1.0;
      };
      const handleCanPlay = () => {
        console.log('🎥 Remote video: canplay');
        // Ensure audio is still enabled
        videoElement.muted = false;
        videoElement.volume = 1.0;
      };
      const handlePlay = () => {
        console.log('🎥 Remote video: play event');
        console.log('🔊 Audio status during play:', {
          muted: videoElement.muted,
          volume: videoElement.volume,
          audioTracks: remoteStream.getAudioTracks().length
        });
      };
      const handlePlaying = () => {
        console.log('🎥 Remote video: playing');
        // Final audio check
        if (videoElement.muted) {
          console.warn('⚠️ Remote video was muted during playing - fixing');
          videoElement.muted = false;
          videoElement.volume = 1.0;
        }
      };
      const handleError = (e) => console.error('❌ Remote video error:', e);
      const handleVolumeChange = () => {
        console.log('🔊 Remote video volume changed:', {
          muted: videoElement.muted,
          volume: videoElement.volume
        });
      };
      
      videoElement.addEventListener('loadstart', handleLoadStart);
      videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('play', handlePlay);
      videoElement.addEventListener('playing', handlePlaying);
      videoElement.addEventListener('error', handleError);
      videoElement.addEventListener('volumechange', handleVolumeChange);
      
      const timer = setTimeout(() => {
        if (isMountedRef.current && videoElement.isConnected) {
          // Force audio settings before play
          videoElement.muted = false;
          videoElement.volume = 1.0;
          handlePlay(videoElement, true);
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        videoElement.removeEventListener('loadstart', handleLoadStart);
        videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('play', handlePlay);
        videoElement.removeEventListener('playing', handlePlaying);
        videoElement.removeEventListener('error', handleError);
        videoElement.removeEventListener('volumechange', handleVolumeChange);
      };
    }
  }, [remoteStream, handlePlay]);

  // **FIXED: Enhanced stream debugging**
  useEffect(() => {
    if (remoteStream && isMountedRef.current) {
      console.log('🔊 Remote stream analysis:', {
        id: remoteStream.id,
        active: remoteStream.active,
        tracks: remoteStream.getTracks().map(track => ({
          kind: track.kind,
          id: track.id,
          label: track.label,
          enabled: track.enabled,
          muted: track.muted,
          readyState: track.readyState
        }))
      });
      
      // Check for audio tracks specifically
      const audioTracks = remoteStream.getAudioTracks();
      if (audioTracks.length === 0) {
        console.warn('⚠️ No audio tracks in remote stream!');
      } else {
        console.log('✅ Remote audio tracks found:', audioTracks.length);
        audioTracks.forEach((track, index) => {
          console.log(`🎵 Audio track ${index}:`, {
            enabled: track.enabled,
            muted: track.muted,
            readyState: track.readyState,
            label: track.label
          });
        });
      }
    }
  }, [remoteStream]);

  // **FIXED: Periodic audio check for remote video**
  useEffect(() => {
    if (!remoteStream || !remoteVideoRef.current) return;
    
    const interval = setInterval(() => {
      const videoElement = remoteVideoRef.current;
      if (videoElement && videoElement.srcObject === remoteStream) {
        if (videoElement.muted) {
          console.warn('⚠️ Remote video became muted - fixing');
          videoElement.muted = false;
          videoElement.volume = 1.0;
        }
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [remoteStream]);

  // Reset play buttons when streams change
  useEffect(() => {
    if (!remoteStream && isMountedRef.current) {
      setShowRemotePlayButton(false);
    }
  }, [remoteStream]);

  useEffect(() => {
    if (!localStream && isMountedRef.current) {
      setShowLocalPlayButton(false);
    }
  }, [localStream]);

  return (
    <div className="flex-1 bg-gray-900 relative flex items-center justify-center">
      {/* Remote video (main) - with max dimensions */}
      <div className="w-full h-full max-w-4xl max-h-[80vh] flex items-center justify-center relative">
        {remoteStream ? (
          <>
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              muted={false} // **FIXED: Critical - Remote video must NOT be muted**
              className="w-full h-full object-contain"
              onLoadedData={() => {
                console.log('🎥 Remote video loadedData event fired');
                const videoElement = remoteVideoRef.current;
                if (videoElement) {
                  // **FIXED: Force audio settings on load**
                  videoElement.muted = false;
                  videoElement.volume = 1.0;
                  console.log('🔊 Audio settings applied:', {
                    muted: videoElement.muted,
                    volume: videoElement.volume
                  });
                }
                if (remoteVideoRef.current && isMountedRef.current) {
                  handlePlay(remoteVideoRef.current, true);
                }
              }}
              onError={(e) => {
                console.error('❌ Remote video error:', e);
              }}
              onPlay={() => {
                console.log('🎥 Remote video started playing');
                const videoElement = remoteVideoRef.current;
                if (videoElement) {
                  console.log('🔊 Audio status on play:', {
                    muted: videoElement.muted,
                    volume: videoElement.volume,
                    audioTracks: remoteStream?.getAudioTracks().length || 0
                  });
                }
              }}
              onPlaying={() => {
                console.log('🎥 Remote video is playing');
                const videoElement = remoteVideoRef.current;
                if (videoElement && videoElement.muted) {
                  console.warn('⚠️ Fixing muted remote video during playing');
                  videoElement.muted = false;
                  videoElement.volume = 1.0;
                }
              }}
            />
            
            {/* Manual play button for remote video */}
            {showRemotePlayButton && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
                <button
                  onClick={handleManualPlayRemote}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-full transition-colors shadow-lg"
                  title="Click to play remote video"
                >
                  <PlayIcon className="h-8 w-8" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg mb-2">
              {callStatus === 'connecting' ? 'Connecting to peer...' : 'Waiting for others to join'}
            </p>
            <p className="text-sm">Status: {callStatus}</p>
            {localStream && callStatus === 'connecting' && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-xs text-gray-500">Establishing connection...</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Local video (overlay) - Enhanced layout */}
      {localStream && (
        <div 
          className={`absolute transition-all duration-300 ease-in-out bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-600 shadow-lg ${
            isLocalVideoMinimized 
              ? 'top-4 right-4 w-32 h-24' 
              : remoteStream 
                ? 'bottom-4 right-4 w-64 h-48' 
                : 'bottom-4 right-4 w-80 h-60'
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={true} // **FIXED: Local video should always be muted to prevent feedback**
            className="w-full h-full object-cover"
            onLoadedData={() => {
              console.log('🎥 Local video loadedData event fired');
              if (localVideoRef.current && isMountedRef.current) {
                handlePlay(localVideoRef.current, false);
              }
            }}
            onError={(e) => {
              console.error('❌ Local video error:', e);
            }}
          />
          
          {/* Local video controls */}
          <div className="absolute top-2 left-2 flex items-center space-x-1">
            <span className="text-xs text-white bg-black bg-opacity-50 px-2 py-1 rounded">
              You
            </span>
            <button
              onClick={() => setIsLocalVideoMinimized(!isLocalVideoMinimized)}
              className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1 rounded transition-colors"
              title={isLocalVideoMinimized ? 'Expand' : 'Minimize'}
            >
              {isLocalVideoMinimized ? (
                <ArrowsPointingOutIcon className="h-3 w-3" />
              ) : (
                <ArrowsPointingInIcon className="h-3 w-3" />
              )}
            </button>
          </div>
          
          {/* Manual play button for local video */}
          {showLocalPlayButton && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <button
                onClick={handleManualPlayLocal}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                title="Click to play local video"
              >
                <PlayIcon className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Enhanced status indicators */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2">
        {callStatus === 'connecting' && (
          <div className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span>Connecting...</span>
          </div>
        )}
        
        {callStatus === 'connected' && remoteStream && (
          <div className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>Connected</span>
          </div>
        )}
        
        {localStream && (
          <div className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm">
            Media Active
          </div>
        )}
      </div>
    </div>
  );
};
const Room = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Debug: Add console logs for context states
  console.log('🏠 Room Component Render:', {
    roomId,
    user: user ? 'authenticated' : 'not authenticated'
  });

  // Room context with fallback handling
  const roomContext = useRoom();
  const {
    room,
    participants,
    isInRoom,
    error: roomError,
    joinRoom,
    leaveRoom,
    clearError
  } = roomContext || {};

  // WebRTC context with fallback handling
  const webrtcContext = useWebRTC();
  const {
    localStream,
    remoteStream,
    callStatus,
    error: webrtcError,
    remoteSocketId,
    getUserMedia,
    endCall,
    toggleVideo,
    toggleAudio,
    clearError: clearWebRTCError
  } = webrtcContext || {};

  // Debug context availability
  console.log('🏠 Context Status:', {
    roomContext: !!roomContext,
    webrtcContext: !!webrtcContext,
    isInRoom,
    room: !!room,
    participants: participants?.length || 0
  });

  // Local state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(true);
  const [mediaInitialized, setMediaInitialized] = useState(false);
  const [joinAttempted, setJoinAttempted] = useState(false);
 useEffect(() => {
  if (roomError) {
    console.log('Room error detected:', roomError);
    
    // Check if the error indicates room is full
    if (roomError.includes('full') || roomError.includes('Full') || roomError.includes('ROOM_FULL')) {
      console.log('Room is full, redirecting to dashboard');
      
      // Set error in room context for dashboard to display
      if (clearError) {
        clearError(); // Clear current error first
      }
      
      // Navigate to dashboard with error state instead of URL params
      navigate('/dashboard', { 
        replace: true,
        state: { 
          roomFullError: {
            type: 'ROOM_FULL',
            message: `Room ${roomId} is currently full (2/2 participants). Please try again later or create a new room.`,
            roomId: roomId
          }
        }
      });
      return;
    }
    
    // For other errors, show them but don't redirect immediately
    console.error('Room error (not full):', roomError);
  }
}, [roomError, roomId, navigate, clearError]);

  // Initialize room with better error handling
 // Also update the joinRoom useEffect to handle the full room error better:
useEffect(() => {
  if (roomId && !isInRoom && user && joinRoom && !joinAttempted) {
    console.log('🏠 Attempting to join room:', roomId);
    setJoinAttempted(true);
    
    joinRoom(roomId).catch(error => {
      console.error('Failed to join room:', error);
      
      // Check if it's a room full error
      const errorMessage = error?.message || error?.toString() || '';
      if (errorMessage.includes('full') || errorMessage.includes('Full') || errorMessage.includes('ROOM_FULL')) {
        console.log('Room join failed: Room is full');
        // Don't set joinAttempted to false here, let the error useEffect handle the redirect
      }
    });
  }
}, [roomId, isInRoom, joinRoom, user, joinAttempted]);

  // Auto-initialize media when room is joined
  useEffect(() => {
    if (isInRoom && !localStream && !mediaInitialized && user && getUserMedia) {
      console.log('🎥 Auto-initializing media for room');
      setMediaInitialized(true);
      getUserMedia().catch(error => {
        console.error('Failed to initialize media:', error);
      });
    }
  }, [isInRoom, localStream, mediaInitialized, getUserMedia, user]);

  // Handle video toggle
  const handleToggleVideo = useCallback(async () => {
    if (!toggleVideo) return;
    
    try {
      await toggleVideo();
      setIsVideoEnabled(prev => !prev);
    } catch (error) {
      console.error('Failed to toggle video:', error);
    }
  }, [toggleVideo]);

  // Handle audio toggle
  const handleToggleAudio = useCallback(async () => {
    if (!toggleAudio) return;
    
    try {
      await toggleAudio();
      setIsAudioEnabled(prev => !prev);
    } catch (error) {
      console.error('Failed to toggle audio:', error);
    }
  }, [toggleAudio]);

  // Handle end call
 

  // Handle leave room
  const handleLeaveRoom = useCallback(async () => {
    try {
     
      if (leaveRoom) {
        await leaveRoom();
      }
      navigate('/');
    } catch (error) {
      console.error('Failed to leave room:', error);
      navigate('/');
    }
  }, [ leaveRoom, navigate]);

  // Clear errors on mount
  useEffect(() => {
    if (clearError) {
      clearError();
    }
    if (clearWebRTCError) {
      clearWebRTCError();
    }
  }, [clearError, clearWebRTCError]);

  // Handle errors
  useEffect(() => {
    if (roomError || webrtcError) {
      console.error('Room or WebRTC error:', roomError || webrtcError);
    }
  }, [roomError, webrtcError]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      console.log('🔒 User not authenticated, redirecting to login');
      navigate('/login');
    }
  }, [user, navigate]);

  // Debug: Check if contexts are missing
  if (!roomContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-500 mb-4">⚠️ Room Context Missing</div>
          <p className="mb-4">The Room context provider is not available.</p>
          <p className="text-sm text-gray-400">Check if RoomProvider is wrapping your app.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!webrtcContext) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center text-white">
          <div className="text-red-500 mb-4">⚠️ WebRTC Context Missing</div>
          <p className="mb-4">The WebRTC context provider is not available.</p>
          <p className="text-sm text-gray-400">Check if WebRTCProvider is wrapping your app.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Redirecting to login...</div>
      </div>
    );
  }

 if (!isInRoom) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Joining room: {roomId}</p>
        {roomError && (
          <div className="mt-4 p-4 bg-red-600 rounded-lg max-w-md">
            <p className="text-sm mb-2">❌ {roomError}</p>
            {/* Check if it's a room full error */}
            {(roomError.includes('full') || roomError.includes('Full') || roomError.includes('ROOM_FULL')) ? (
              <div className="text-center">
                <p className="text-xs mb-3">Redirecting to dashboard...</p>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mx-auto"></div>
              </div>
            ) : (
              <div className="flex space-x-2 justify-center">
                <button
                  onClick={() => {
                    setJoinAttempted(false);
                    if (clearError) clearError();
                  }}
                  className="px-3 py-1 bg-red-700 hover:bg-red-800 rounded text-sm"
                >
                  Retry
                </button>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-800 rounded text-sm"
                >
                  Go Back
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      

      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-white">
              Room: {roomId}
            </h1>
            <div className="flex items-center space-x-2 text-sm text-gray-400">
              <UserGroupIcon className="h-4 w-4" />
              <span>{(participants?.length || 0) + 1} participants</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Toggle buttons */}
            <button
              onClick={() => setShowCodeEditor(!showCodeEditor)}
              className={`p-2 rounded-lg transition-colors ${
                showCodeEditor 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Code Editor"
            >
              <CodeBracketIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-2 rounded-lg transition-colors ${
                showChat 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Chat"
            >
              <ChatBubbleLeftIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => setShowParticipants(!showParticipants)}
              className={`p-2 rounded-lg transition-colors ${
                showParticipants 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
              title="Toggle Participants"
            >
              <UserGroupIcon className="h-5 w-5" />
            </button>
            
            <button
              onClick={handleLeaveRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>

      {/* Error display */}
      {(roomError || webrtcError) && (
        <div className="bg-red-600 text-white px-4 py-2 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm">{roomError || webrtcError}</span>
          </div>
          <button
            onClick={() => {
              if (clearError) {
                clearError();
              }
              if (clearWebRTCError) {
                clearWebRTCError();
              }
            }}
            className="text-white hover:text-gray-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Main content */}
     {/* Main content */}
<div className="flex-1 flex justify-center">
  {/* Video call section */}
  <div className={`${
    showCodeEditor 
      ? 'w-1/2' 
      : 'w-full max-w-6xl' // Constrain max width when code editor is hidden
  } flex flex-col`}>
    <VideoCall
      localStream={localStream}
      remoteStream={remoteStream}
      callStatus={callStatus}
    />
    
    {/* Media controls */}
    <div className="bg-gray-800 border-t border-gray-700 px-4 py-3">
      <div className="flex items-center justify-center space-x-4">
        {!localStream ? (
          <button
            onClick={() => {
              if (getUserMedia) {
                getUserMedia().catch(error => {
                  console.error('Failed to get user media:', error);
                });
              }
            }}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2"
          >
            <VideoCameraIcon className="h-5 w-5" />
            <span>Start Video</span>
          </button>
        ) : (
          <>
            <button
              onClick={handleToggleVideo}
              className={`p-3 rounded-full transition-colors ${
                isVideoEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
            >
              <VideoCameraIcon className="h-6 w-6" />
            </button>
            
            <button
              onClick={handleToggleAudio}
              className={`p-3 rounded-full transition-colors ${
                isAudioEnabled
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
              title={isAudioEnabled ? 'Mute microphone' : 'Unmute microphone'}
            >
              <MicrophoneIcon className="h-6 w-6" />
            </button>
            
          
          </>
        )}
      </div>
    </div>
  </div>
  
  {/* Code editor panel */}
  {showCodeEditor && (
    <div className="w-1/2 border-l border-gray-700">
      <CodeEditor roomId={roomId} />
    </div>
  )}
</div>

      {/* Side panels */}
      {showChat && (
        <div className="fixed right-0 top-16 bottom-0 w-80 bg-gray-800 border-l border-gray-700 z-50">
          <Chat roomId={roomId} />
        </div>
      )}
      
      {showParticipants && (
        <div className="fixed right-0 top-16 bottom-0 w-64 bg-gray-800 border-l border-gray-700 z-40">
          <ParticipantsList participants={participants} />
        </div>
      )}
     
    </div>
  );
};

export default Room;
