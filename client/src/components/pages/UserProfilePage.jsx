// src/components/pages/UserProfile.js
import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../context/UserContext';
import { useAuth } from '../../context/auth/AuthContext';

const UserProfile = () => {
  const { user, logout } = useAuth();
  const { 
    updateUserProfile, 
    updateUserAvatar, 
    deleteUserAccount, 
    updateLoading, 
    error, 
    clearError 
  } = useUserProfile();

  // Form states
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: ''
  });
 
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Initialize form data when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        username: user.username || '',
        email: user.email || ''
      });
    }
  }, [user]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle avatar file selection
 

  // Handle profile update
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    clearError();
    setSuccessMessage('');

    // Update basic profile info
    const result = await updateUserProfile({
      fullName: formData.fullName,
      username: formData.username
    });

    if (result.success) {
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update avatar if file is selected
    
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    const result = await deleteUserAccount();
    if (result.success) {
      // User will be automatically logged out and redirected
    }
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setFormData({
      fullName: user.fullName || '',
      username: user.username || '',
      email: user.email || ''
    });
   
    clearError();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-8 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-gradient-to-br from-emerald-100 to-blue-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-teal-300 to-emerald-400 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-emerald-100/50 border border-emerald-200/50 p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
                User Profile
              </h1>
              <p className="text-slate-600 mt-2">Manage your account settings and preferences</p>
            </div>
            <button
              onClick={() => logout()}
              className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-xl hover:from-slate-600 hover:to-slate-700 transition-all duration-300 shadow-lg shadow-slate-300/50"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="ml-3 text-sm font-medium text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <div className="flex">
              <div className="flex-shrink-0">
                <div className="w-6 h-6 bg-gradient-to-br from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                  <svg className="h-4 w-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
              <p className="ml-3 text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-emerald-100/50 border border-emerald-200/50">
          <div className="px-8 py-6 border-b border-emerald-200/50">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Profile Information</h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-300 shadow-lg shadow-emerald-500/25"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="p-8">
            {/* Avatar Section */}
           

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 mb-3">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500 border-slate-200' 
                      : 'bg-white/70 backdrop-blur-sm text-slate-800 border-emerald-200 hover:border-emerald-300'
                  }`}
                  required
                />
              </div>

              {/* Username */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 mb-3">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-300 ${
                    !isEditing 
                      ? 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500 border-slate-200' 
                      : 'bg-white/70 backdrop-blur-sm text-slate-800 border-emerald-200 hover:border-emerald-300'
                  }`}
                  required
                />
              </div>

              {/* Email (Read-only) */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-3">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500"
                />
                <p className="mt-2 text-xs text-slate-500">Email cannot be changed</p>
              </div>

              {/* Account Created */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  Member Since
                </label>
                <input
                  type="text"
                  value={new Date(user.createdAt).toLocaleDateString()}
                  disabled
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 text-slate-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="mt-8 flex items-center justify-between">
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    disabled={updateLoading}
                    className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg shadow-emerald-500/25 flex items-center"
                  >
                    {updateLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Updating...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-8 py-3 bg-gradient-to-r from-slate-300 to-slate-400 text-slate-700 rounded-xl hover:from-slate-400 hover:to-slate-500 hover:text-white transition-all duration-300 shadow-lg shadow-slate-300/50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Danger Zone */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg shadow-red-100/50 border border-red-200/50 mt-8">
          <div className="px-8 py-6 border-b border-red-200/50">
            <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-slate-800">Delete Account</h3>
                <p className="text-sm text-slate-600 mt-2">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg shadow-red-300/50"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-slate-800/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl shadow-red-500/25 border border-red-200/50">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">Confirm Account Deletion</h3>
              <p className="text-sm text-slate-600 mb-8 leading-relaxed">
                Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={handleDeleteAccount}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg shadow-red-300/50"
                >
                  Yes, Delete Account
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-slate-300 to-slate-400 text-slate-700 rounded-xl hover:from-slate-400 hover:to-slate-500 hover:text-white transition-all duration-300 shadow-lg shadow-slate-300/50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;