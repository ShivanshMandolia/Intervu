// src/components/auth/ProtectedRoute.js
import React from 'react';
import { useAuth } from '../../context/auth/AuthContext';
import LandingPage from '../pages/LandingPage';
import LoadingSpinner from '../common/LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <LandingPage />;
  }

  return children;
};

export default ProtectedRoute;