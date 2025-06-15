// src/components/ParticipantsList.jsx
import React from 'react';
import { 
  UserIcon, 
  PhoneIcon, 
  VideoCameraIcon,
  MicrophoneIcon 
} from '@heroicons/react/24/outline';

const ParticipantsList = ({ participants, onStartCall, currentUser }) => {
  const getInitials = (user) => {
    if (user?.username) {
      return user.username.slice(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getDisplayName = (user) => {
    return user?.username || user?.email || 'Unknown User';
  };

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-medium text-white">
          Participants ({participants.length + 1})
        </h3>
      </div>

      {/* Participants List */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Current User */}
        <div className="mb-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {getInitials(currentUser)}
              </span>
            </div>
            <div className="flex-1">
              <div className="text-white font-medium text-sm">
                {getDisplayName(currentUser)} (You)
              </div>
              <div className="text-gray-400 text-xs">Host</div>
            </div>
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
            </div>
          </div>
        </div>

        {/* Other Participants */}
        <div className="space-y-2">
          {participants.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="h-12 w-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                No other participants yet
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Share the room ID to invite others
              </p>
            </div>
          ) : (
            participants.map((participant) => (
              <div
                key={participant.socketId}
                className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {getInitials(participant.user)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">
                    {getDisplayName(participant.user)}
                  </div>
                  <div className="text-gray-400 text-xs">Participant</div>
                </div>

                <div className="flex items-center space-x-1">
                  {/* Status indicator */}
                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Online"></div>
                  
                  {/* Action buttons */}
                  <button
                    onClick={() => onStartCall(participant.socketId)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Start video call"
                  >
                    <VideoCameraIcon className="h-4 w-4" />
                  </button>
                  
                  <button
                    onClick={() => onStartCall(participant.socketId)}
                    className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                    title="Start voice call"
                  >
                    <PhoneIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Room Info */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="text-xs text-gray-400 space-y-1">
          <div>Room Status: Active</div>
          <div>Total Participants: {participants.length + 1}</div>
        </div>
      </div>
    </div>
  );
};

export default ParticipantsList;