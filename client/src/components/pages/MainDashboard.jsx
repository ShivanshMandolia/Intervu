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
  const { error, setError } = useRoom(); // Make sure setError is available in context
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-20 w-64 h-64 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-40 blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-gradient-to-br from-emerald-100 to-blue-200 rounded-full opacity-40 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-br from-teal-300 to-emerald-400 rounded-full opacity-30 blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl shadow-sm border-b border-emerald-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                intervU
          
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">
                Welcome, {user?.username || user?.email}
              </span>
              <button
                onClick={() => navigate('/profile')}
                className="text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Profile
              </button>
              <button
                onClick={logout}
                className="text-sm text-slate-500 hover:text-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-col relative z-10">
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={handleCreateRoom}
              className="group relative flex items-center justify-center p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-300/50 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <PlusIcon className="h-6 w-6 mr-2 relative z-10" />
              <span className="relative z-10">Create New Room</span>
            </button>
            <button
              onClick={handleJoinRoom}
              className="group relative flex items-center justify-center p-6 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-teal-300/50 hover:shadow-xl hover:shadow-blue-300/50 transform hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <UserGroupIcon className="h-6 w-6 mr-2 relative z-10" />
              <span className="relative z-10">Join Existing Room</span>
            </button>
          </div>
        </div>

        {/* Room Capacity Info */}
        <div className="mb-6 bg-white/70 backdrop-blur-xl border border-emerald-200 rounded-xl p-6 shadow-lg shadow-emerald-100/50">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-slate-800">
                Room Capacity
              </h3>
              <div className="mt-2 text-sm text-slate-600">
                <p>Each room supports a maximum of <strong className="text-emerald-600">2 participants</strong> for optimal collaboration experience.</p>
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
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-emerald-500/25 border border-emerald-200/50">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Create New Room</h2>
        
        {/* Capacity Info */}
        <div className="mb-6 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-slate-700">
                Room will support up to <strong className="text-emerald-600">2 participants</strong>
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70 backdrop-blur-sm text-slate-800 placeholder-slate-500"
              placeholder="Enter room name"
              required
              disabled={isCreating}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room Type
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70 backdrop-blur-sm text-slate-800"
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
              className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isCreating}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-not transition-all duration-300 shadow-lg shadow-emerald-500/25"
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
  const { setError } = useRoom(); // Access setError from room context
  const [roomId, setRoomId] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsJoining(true);
    setLocalError('');

    try {
      // Clean up room ID (remove "room-" prefix if present)
      const cleanRoomId = roomId.replace(/^room-/, '');
      const finalRoomId = cleanRoomId.startsWith('room-') ? cleanRoomId : `room-${cleanRoomId}`;
      
      // Mock room joining - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API delay
      
      // Simulate room capacity check
      const isRoomFull = Math.random() < 0.3; // 30% chance room is full for demo
      
      if (isRoomFull) {
        // Set the global room error instead of local error
        setError({
          type: 'ROOM_FULL',
          message: 'This room is currently full (2/2 participants). Please try again later or create a new room.',
          roomId: finalRoomId
        });
        onClose(); // Close the modal
        return;
      }
      
      onRoomJoined(finalRoomId);
    } catch (error) {
      console.error('Error joining room:', error);
      setLocalError('Failed to join room. Please check the room ID and try again.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleRoomIdChange = (e) => {
    setRoomId(e.target.value);
    if (error) setLocalError(''); // Clear error when user starts typing
  };

  return (
    <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 w-full max-w-md shadow-2xl shadow-teal-300/50 border border-emerald-200/50">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">Join Room</h2>
        
        {/* Capacity Warning */}
        <div className="mb-4 bg-gradient-to-r from-blue-50 to-teal-50 border border-blue-200 rounded-xl p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-teal-100 rounded-lg flex items-center justify-center">
                <UserGroupIcon className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm text-slate-700">
                If the room is full (2/2), you'll be notified and can create a new room instead.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={handleRoomIdChange}
              className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/70 backdrop-blur-sm text-slate-800 placeholder-slate-500"
              placeholder="Enter room ID (e.g., room-123 or 123)"
              required
              disabled={isJoining}
            />
            <p className="text-xs text-slate-500 mt-2">
              You can enter the room ID with  the "room-" prefix
            </p>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 hover:text-slate-800 transition-colors"
              disabled={isJoining}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-xl hover:from-teal-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-300 shadow-lg shadow-teal-300/50"
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