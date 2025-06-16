import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import { useRoom } from '../../context/RoomContext';
import RoomFullMessage from '../RoomFullMessage';
import { 
  PlusIcon, 
  UserGroupIcon, 
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { error } = useRoom(); // Access room error state
  const navigate = useNavigate();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      // Mock rooms data
     
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleJoinRoom = () => {
    setShowJoinModal(true);
  };

  const handleEnterRoom = (roomId) => {
    navigate(`/room/${roomId}`);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">CodeCollab</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.username || user?.email}
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Profile
              </button>
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-col">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateRoom}
              className="flex items-center justify-center p-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="h-6 w-6 mr-2" />
              Create New Room
            </button>
            <button
              onClick={handleJoinRoom}
              className="flex items-center justify-center p-6 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserGroupIcon className="h-6 w-6 mr-2" />
              Join Existing Room
            </button>
          </div>
        </div>

        {/* Room Capacity Info */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Room Capacity
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>Each room supports a maximum of <strong>2 participants</strong> for optimal collaboration experience.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Room Full Message Modal */}
      <RoomFullMessage />

      {/* Create Room Modal */}
      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={(roomId) => {
            setShowCreateModal(false);
            navigate(`/room/${roomId}`);
          }}
        />
      )}
      
      {/* Join Room Modal */}
      {showJoinModal && (
        <JoinRoomModal 
          onClose={() => setShowJoinModal(false)}
          onRoomJoined={(roomId) => {
            setShowJoinModal(false);
            navigate(`/room/${roomId}`);
          }}
        />
      )}
    </div>
  );
};

// Enhanced Create Room Modal with capacity info
const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('practice');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    
    try {
      // Mock room creation - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      const roomId = `room-${Date.now()}`;
      onRoomCreated(roomId);
    } catch (error) {
      console.error('Error creating room:', error);
      // Handle error - could show error message to user
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium mb-4">Create New Room</h2>
        
        {/* Capacity Info */}
        <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Room will support up to <strong>2 participants</strong>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room name"
              required
              disabled={isCreating}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isCreating}
            >
              <option value="practice">Practice</option>
              <option value="interview">Interview</option>
              <option value="meeting">Meeting</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Enhanced Join Room Modal with capacity info
const JoinRoomModal = ({ onClose, onRoomJoined }) => {
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setError('');

    try {
      // Clean up room ID (remove "room-" prefix if present)
      const cleanRoomId = roomId.replace(/^room-/, '');
      const finalRoomId = cleanRoomId.startsWith('room-') ? cleanRoomId : `room-${cleanRoomId}`;
      
      // Mock room joining - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Simulate room capacity check
      const isRoomFull = Math.random() < 0.3; // 30% chance room is full for demo
      
      if (isRoomFull) {
        setError('This room is currently full (2/2 participants). Please try again later or create a new room.');
        return;
      }
      
      onRoomJoined(finalRoomId);
    } catch (error) {
      console.error('Error joining room:', error);
      setError('Failed to join room. Please check the room ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
    if (error) setError(''); // Clear error when user starts typing
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium mb-4">Join Room</h2>
        
        {/* Capacity Warning */}
        <div className="mb-4 bg-orange-50 border border-orange-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <UserGroupIcon className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                If the room is full (2/2), you'll be notified and can create a new room instead.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={handleRoomIdChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room ID (e.g., room-123 or 123)"
              required
              disabled={isJoining}
            />
            <p className="text-xs text-gray-500 mt-1">
              You can enter the room ID with or without the "room-" prefix
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isJoining}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                'Join Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;