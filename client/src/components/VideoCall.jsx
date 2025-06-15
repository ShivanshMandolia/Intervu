// frontend/src/components/VideoCall.jsx
import React, { useEffect, useRef, useState, useCallback } from 'react';

const VideoCall = ({ 
  localStream, 
  remoteStreams, 
  participants
}) => {
  const localVideoRef = useRef(null);
  const [remoteVideoRefs, setRemoteVideoRefs] = useState(new Map());
  const [videoLoadingStates, setVideoLoadingStates] = useState(new Map());

  // Set up local video stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      console.log('Setting local video stream');
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Create refs for remote videos dynamically
  useEffect(() => {
    const newRefs = new Map();
    
    if (remoteStreams && typeof remoteStreams === 'object') {
      Object.keys(remoteStreams).forEach(socketId => {
        if (!remoteVideoRefs.has(socketId)) {
          newRefs.set(socketId, React.createRef());
        } else {
          newRefs.set(socketId, remoteVideoRefs.get(socketId));
        }
      });
    }

    setRemoteVideoRefs(newRefs);
  }, [remoteStreams]);

  // Set up remote video streams
  useEffect(() => {
    if (!remoteStreams || typeof remoteStreams !== 'object') return;

    Object.entries(remoteStreams).forEach(([socketId, stream]) => {
      const videoRef = remoteVideoRefs.get(socketId);
      if (videoRef && videoRef.current && stream) {
        console.log('Setting remote video stream for:', socketId);
        videoRef.current.srcObject = stream;
        
        // Set loading state
        setVideoLoadingStates(prev => new Map(prev.set(socketId, true)));
        
        // Handle video load events
        const handleLoadedData = () => {
          console.log('Remote video loaded for:', socketId);
          setVideoLoadingStates(prev => new Map(prev.set(socketId, false)));
        };
        
        const handleError = (error) => {
          console.error('Remote video error for:', socketId, error);
          setVideoLoadingStates(prev => new Map(prev.set(socketId, false)));
        };

        videoRef.current.addEventListener('loadeddata', handleLoadedData);
        videoRef.current.addEventListener('error', handleError);
        
        // Cleanup event listeners
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadeddata', handleLoadedData);
            videoRef.current.removeEventListener('error', handleError);
          }
        };
      }
    });
  }, [remoteStreams, remoteVideoRefs]);

  // Get participant info by socket ID
  const getParticipantInfo = useCallback((socketId) => {
    const participant = participants.find(p => p.socketId === socketId);
    return {
      name: participant?.username || participant?.email || 'Unknown User',
      avatar: participant?.avatar || null
    };
  }, [participants]);

  // Render remote videos
  const renderRemoteVideos = () => {
    if (!remoteStreams || typeof remoteStreams !== 'object') return null;

    return Object.entries(remoteStreams).map(([socketId, stream]) => {
      const participantInfo = getParticipantInfo(socketId);
      const videoRef = remoteVideoRefs.get(socketId);
      const isLoading = videoLoadingStates.get(socketId) || false;
      
      return (
        <div key={socketId} className="relative bg-gray-800 rounded-lg overflow-hidden group">
          {/* Loading indicator */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}
          
          {/* Video element */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
            onLoadedData={() => {
              console.log('Video loaded for:', socketId);
              setVideoLoadingStates(prev => new Map(prev.set(socketId, false)));
            }}
            onError={(error) => {
              console.error('Video error for:', socketId, error);
              setVideoLoadingStates(prev => new Map(prev.set(socketId, false)));
            }}
          />
          
          {/* Participant name overlay */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-sm font-medium">
            {participantInfo.name}
          </div>
          
          {/* Connection indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    });
  };

  // Render participants without video connection
  const renderConnectingParticipants = () => {
    return participants
      .filter(p => !remoteStreams || !remoteStreams[p.socketId])
      .map(participant => {
        const participantInfo = getParticipantInfo(participant.socketId);
        
        return (
          <div key={participant.socketId} className="relative bg-gray-700 rounded-lg flex items-center justify-center">
            <div className="text-center p-4">
              {/* Avatar or initial */}
              <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3 relative">
                {participantInfo.avatar ? (
                  <img 
                    src={participantInfo.avatar} 
                    alt={participantInfo.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-white font-semibold">
                    {participantInfo.name[0].toUpperCase()}
                  </span>
                )}
                
                {/* Loading indicator */}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              </div>
              
              <p className="text-white text-sm font-medium mb-1">
                {participantInfo.name}
              </p>
              <p className="text-gray-400 text-xs">
                Connecting...
              </p>
            </div>
          </div>
        );
      });
  };

  // Calculate grid layout
  const getVideoGridClass = () => {
    const remoteVideoCount = remoteStreams ? Object.keys(remoteStreams).length : 0;
    const connectingCount = participants.filter(p => !remoteStreams || !remoteStreams[p.socketId]).length;
    const totalVideos = 1 + remoteVideoCount + connectingCount; // +1 for local video
    
    if (totalVideos <= 1) return 'grid-cols-1';
    if (totalVideos <= 2) return 'grid-cols-1 md:grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-2 md:grid-cols-3';
    if (totalVideos <= 9) return 'grid-cols-3';
    return 'grid-cols-3 md:grid-cols-4';
  };

  // Handle local video errors
  const handleLocalVideoError = (error) => {
    console.error('Local video error:', error);
  };

  return (
    <div className="flex-1 bg-gray-900 p-4">
      {/* Video Grid */}
      <div className={`grid ${getVideoGridClass()} gap-4 h-full min-h-0`}>
        {/* Local Video */}
        <div className="relative bg-gray-800 rounded-lg overflow-hidden group">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted={true}
            className="w-full h-full object-cover mirror"
            onError={handleLocalVideoError}
            style={{ transform: 'scaleX(-1)' }} // Mirror effect for local video
          />
          
          {/* You label */}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded-md text-sm font-medium">
            You
          </div>
          
          {/* Local video indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          </div>
          
          {/* No local stream indicator */}
          {!localStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl text-white">📷</span>
                </div>
                <p className="text-white text-sm">Camera Off</p>
              </div>
            </div>
          )}
        </div>

        {/* Remote Videos */}
        {renderRemoteVideos()}

        {/* Connecting Participants */}
        {renderConnectingParticipants()}
      </div>

      {/* Empty state when no participants */}
      {participants.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <div className="text-6xl mb-4">👥</div>
            <p className="text-lg mb-2">Waiting for participants...</p>
            <p className="text-sm">Share the room link to invite others</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;