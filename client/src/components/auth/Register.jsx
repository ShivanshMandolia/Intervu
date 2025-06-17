// src/components/auth/Register.js
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, Video, ArrowLeft, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/auth/AuthContext';

const Register = ({ setCurrentView }) => {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setLocalError('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setLocalError('Email is required');
      return false;
    }

    if (!formData.username.trim()) {
      setLocalError('Username is required');
      return false;
    }

    if (formData.username.length < 3) {
      setLocalError('Username must be at least 3 characters long');
      return false;
    }

    if (!formData.password.trim()) {
      setLocalError('Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setLocalError('Password must be at least 6 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    setSuccess('');

    if (!validateForm()) return;

    const userData = {
      fullName: formData.fullName.trim(),
      email: formData.email.trim().toLowerCase(),
      username: formData.username.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };

    const result = await register(userData);
    if (result.success) {
      setSuccess(result.message);
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        username: '',
        password: '',
        confirmPassword: ''
      });
      // Redirect to login after 2 seconds
      setTimeout(() => {
        setCurrentView('login');
      }, 2000);
    } else {
      setLocalError(result.message || 'Registration failed');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-20 right-20 w-96 h-96 bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full opacity-40 blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 left-20 w-80 h-80 bg-gradient-to-tr from-emerald-100 to-blue-200 rounded-full opacity-40 blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-teal-300 to-emerald-400 rounded-full opacity-30 blur-3xl animate-pulse delay-500"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center text-slate-500 hover:text-slate-800 mb-6 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Video className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent">
              intervU
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Create Account</h1>
          <p className="text-slate-600">Join intervU and start interviewing today</p>
        </div>

        {/* Register Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-300/20 border border-emerald-200/50 p-8">
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <span className="text-red-700 text-sm">{displayError}</span>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start">
              <CheckCircle className="w-5 h-5 text-emerald-600 mr-2 mt-0.5" />
              <span className="text-emerald-700 text-sm">{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            {/* Username Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Username
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Choose a username"
                  required
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">Must be at least 3 characters long</p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-14 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Create a password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-emerald-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-500" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-slate-500">Must be at least 6 characters long</p>
            </div>

            {/* Confirm Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-2">
                Confirm Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-14 py-3 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center hover:text-emerald-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-slate-500" />
                  ) : (
                    <Eye className="h-5 w-5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transform mt-6"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <span className="text-slate-600">Already have an account? </span>
            <button
              onClick={() => setCurrentView('login')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline"
            >
              Sign in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;