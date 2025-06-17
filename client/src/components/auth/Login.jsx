// src/components/auth/Login.js
import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, Video, ArrowLeft, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/auth/AuthContext';

const Login = ({ setCurrentView }) => {
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loginType, setLoginType] = useState('email'); // 'email' or 'username'
  const [localError, setLocalError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setLocalError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Basic validation
    if (!formData.password.trim()) {
      setLocalError('Password is required');
      return;
    }

    if (loginType === 'email' && !formData.email.trim()) {
      setLocalError('Email is required');
      return;
    }

    if (loginType === 'username' && !formData.username.trim()) {
      setLocalError('Username is required');
      return;
    }

    const credentials = {
      password: formData.password,
      ...(loginType === 'email' ? { email: formData.email } : { username: formData.username })
    };

    const result = await login(credentials);
    if (!result.success) {
      setLocalError(result.message || 'Login failed');
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
          
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Welcome Back</h1>
          <p className="text-slate-600">Sign in to your account to continue</p>
        </div>

        {/* Login Form */}
        <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-300/20 border border-emerald-200/50 p-8">
          {displayError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <span className="text-red-700 text-sm">{displayError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Login Type Toggle */}
            <div className="flex bg-emerald-50 rounded-xl p-1 border border-emerald-200/50">
              <button
                type="button"
                onClick={() => setLoginType('email')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginType === 'email'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginType('username')}
                className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  loginType === 'username'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/25'
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }`}
              >
                Username
              </button>
            </div>

            {/* Email/Username Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
                {loginType === 'email' ? 'Email Address' : 'Username'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-emerald-600 transition-colors" />
                </div>
                <input
                  type={loginType === 'email' ? 'email' : 'text'}
                  name={loginType}
                  value={formData[loginType]}
                  onChange={handleInputChange}
                  className="block w-full pl-12 pr-4 py-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder={loginType === 'email' ? 'Enter your email' : 'Enter your username'}
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-3">
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
                  className="block w-full pl-12 pr-14 py-4 border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-slate-800 placeholder-slate-500"
                  placeholder="Enter your password"
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 text-white font-semibold rounded-xl hover:from-emerald-700 hover:via-teal-700 hover:to-blue-700 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] transform"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <span className="text-slate-600">Don't have an account? </span>
            <button
              onClick={() => setCurrentView('register')}
              className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors hover:underline"
            >
              Sign up here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;