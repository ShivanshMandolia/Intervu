// src/context/user/UserProfileContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth/AuthContext';

const UserProfileContext = createContext();

// API Base URL - Should match your backend
const API_BASE_URL = 'http://localhost:8000'; // Change this to your backend URL

export const UserProfileProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  // Get current user profile
  const getUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        return { success: false };
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
        return { success: true, data: data.data };
      } else {
        setError(data.message || 'Failed to fetch profile');
        return { success: false, message: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    setUpdateLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        return { success: false };
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
        return { success: true, data: data.data, message: data.message };
      } else {
        setError(data.message || 'Failed to update profile');
        return { success: false, message: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setUpdateLoading(false);
    }
  };

  // Update user avatar (if you implement file upload)
  const updateUserAvatar = async (avatarFile) => {
    setUpdateLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        return { success: false };
      }

      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await fetch(`${API_BASE_URL}/api/v1/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data);
        return { success: true, data: data.data, message: data.message };
      } else {
        setError(data.message || 'Failed to update avatar');
        return { success: false, message: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setUpdateLoading(false);
    }
  };

  // Delete user account
  const deleteUserAccount = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('No authentication token found');
        return { success: false };
      }

      const response = await fetch(`${API_BASE_URL}/api/v1/users/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        // Clear user data and tokens
        setUser(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return { success: true, message: data.message };
      } else {
        setError(data.message || 'Failed to delete account');
        return { success: false, message: data.message };
      }
    } catch (error) {
      const errorMessage = 'Network error. Please try again.';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError('');
  };

  const value = {
    user,
    loading,
    updateLoading,
    error,
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    deleteUserAccount,
    clearError,
    setError
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Custom hook to use user profile context
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};