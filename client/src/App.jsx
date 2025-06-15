// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import { WebRTCProvider } from './context/WebRTCContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/pages/MainDashboard';
import Room from './components/pages/RoomPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <Dashboard />
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/room/:roomId" 
              element={
                <ProtectedRoute>
                  <SocketProvider>
                    <RoomProvider>
                      <WebRTCProvider>
                        <Room />
                      </WebRTCProvider>
                    </RoomProvider>
                  </SocketProvider>
                </ProtectedRoute>
              } 
            />
            
            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;