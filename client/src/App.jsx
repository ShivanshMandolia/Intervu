// App.js - Updated with UserProfile integration
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/auth/AuthContext';
import { UserProfileProvider } from './context/UserContext';
import { SocketProvider } from './context/SocketContext';
import { RoomProvider } from './context/RoomContext';
import { WebRTCProvider } from './context/WebRTCContext';
import { CodeEditorProvider } from './context/CodeEditorContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/pages/MainDashboard';
import Room from './components/pages/RoomPage';
import UserProfile from './components/pages/UserProfilePage.jsx';

function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
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
                      <RoomProvider>
                        <Dashboard />
                      </RoomProvider>
                    </SocketProvider>
                  </ProtectedRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
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
                          <CodeEditorProvider>
                            <Room />
                          </CodeEditorProvider>
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
      </UserProfileProvider>
    </AuthProvider>
  );
}

export default App;