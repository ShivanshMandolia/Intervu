import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth/AuthContext';
import { 
  PlusIcon, 
  UserGroupIcon, 
  VideoCameraIcon,
  CodeBracketIcon,
  ClockIcon,
  TrashIcon,
  PencilIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data - replace with actual API calls
  useEffect(() => {
    // Simulate API call
    const fetchData = async () => {
      setLoading(true);
      // Mock rooms data
      setRooms([
        {
          _id: '1',
          roomId: 'room-123',
          name: 'Interview Prep Session',
          type: 'interview',
          participants: 3,
          maxParticipants: 5,
          status: 'active',
          createdAt: new Date().toISOString(),
        },
        {
          _id: '2',
          roomId: 'room-456',
          name: 'Algorithm Practice',
          type: 'practice',
          participants: 2,
          maxParticipants: 10,
          status: 'active',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
        }
      ]);

      // Mock recent activity
      setRecentActivity([
        {
          id: '1',
          type: 'room_joined',
          roomName: 'Interview Prep Session',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '2',
          type: 'code_updated',
          roomName: 'Algorithm Practice',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
        }
      ]);
      
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

  const getActivityIcon = (type) => {
    switch (type) {
      case 'room_joined':
        return <UserGroupIcon className="h-4 w-4 text-blue-500" />;
      case 'code_updated':
        return <CodeBracketIcon className="h-4 w-4 text-green-500" />;
      case 'call_started':
        return <VideoCameraIcon className="h-4 w-4 text-purple-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Rooms */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Rooms</h3>
              </div>
              <div className="p-6">
                {rooms.length === 0 ? (
                  <div className="text-center py-8">
                    <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No rooms yet. Create your first room!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rooms.map((room) => (
                      <div
                        key={room._id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {room.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              Room ID: {room.roomId}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                room.type === 'interview' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {room.type}
                              </span>
                              <span className="text-sm text-gray-500">
                                {room.participants}/{room.maxParticipants} participants
                              </span>
                              <span className="text-sm text-gray-500">
                                Created {formatDate(room.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEnterRoom(room.roomId)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              Enter
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600">
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            <button className="p-2 text-gray-400 hover:text-red-600">
                              <TrashIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6">
                {recentActivity.length === 0 ? (
                  <p className="text-gray-500 text-center">No recent activity</p>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            {activity.type === 'room_joined' && `Joined ${activity.roomName}`}
                            {activity.type === 'code_updated' && `Updated code in ${activity.roomName}`}
                            {activity.type === 'call_started' && `Started call in ${activity.roomName}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Stats */}
            <div className="mt-6 bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Your Stats</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Rooms Created</span>
                    <span className="text-sm font-medium text-gray-900">{rooms.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sessions</span>
                    <span className="text-sm font-medium text-gray-900">12</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Hours Coded</span>
                    <span className="text-sm font-medium text-gray-900">24.5</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals would go here - CreateRoomModal and JoinRoomModal */}
      {showCreateModal && (
        <CreateRoomModal 
          onClose={() => setShowCreateModal(false)}
          onRoomCreated={(roomId) => {
            setShowCreateModal(false);
            navigate(`/room/${roomId}`);
          }}
        />
      )}
      
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

// Mock Modal Components (you'll need to implement these)
const CreateRoomModal = ({ onClose, onRoomCreated }) => {
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('practice');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Mock room creation
    const roomId = `room-${Date.now()}`;
    onRoomCreated(roomId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium mb-4">Create New Room</h2>
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
            >
              <option value="practice">Practice</option>
              <option value="interview">Interview</option>
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Create Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JoinRoomModal = ({ onClose, onRoomJoined }) => {
  const [roomId, setRoomId] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onRoomJoined(roomId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-lg font-medium mb-4">Join Room</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Room ID
            </label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter room ID"
              required
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Join Room
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Dashboard;