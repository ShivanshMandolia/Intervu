// frontend/src/components/RoomFullMessage.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useRoom } from './../context/RoomContext';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const RoomFullMessage = () => {
  const { error, clearError } = useRoom();
  const navigate = useNavigate();

  if (!error || error.type !== 'ROOM_FULL') {
    return null;
  }

  const handleGoBack = () => {
    clearError();
    navigate('/');
  };

  const handleCreateNewRoom = () => {
    clearError();
    navigate('/');
    // You can add additional logic here to open the create room modal
    // or navigate to a dedicated create room page
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Room Full
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-500">
            {error.message || "This room is currently full (2/2 participants). Please try again later or create a new room."}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Each room supports a maximum of 2 participants for optimal collaboration experience.
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            onClick={handleGoBack}
          >
            Go Back
          </button>
          <button
            type="button"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={handleCreateNewRoom}
          >
            Create New Room
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoomFullMessage;