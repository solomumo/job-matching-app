import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Plans from './pages/Plans';
import Preferences from './pages/Preferences';
import Jobs from './pages/Jobs';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import JobAnalysis from './pages/JobAnalysis';
import PaymentCallback from './pages/PaymentCallback';
import Subscription from './pages/Subscription';
import GenerateCV from './pages/GenerateCV';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Applications from './pages/Applications';
import { NotificationsProvider } from './context/NotificationsContext';
import Help from './pages/Help';
import AdminPortal from './pages/AdminPortal';

// Protected Route component - moved to top level
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return children;
};

function App() {
  return (
    <GoogleOAuthProvider clientId="1009534603089-2lkecure0lt1kvrmbonleuf9m0vfuagj.apps.googleusercontent.com">
      <Router>
        <AuthProvider>
          <NotificationsProvider>
            <Navbar />
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/plans" element={<Plans />} />
              <Route 
                path="/subscription" 
                element={
                  <ProtectedRoute>
                    <Subscription />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs" 
                element={
                  <ProtectedRoute>
                    <Jobs />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/preferences" 
                element={
                  <ProtectedRoute>
                    <Preferences />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/:id/analyze" 
                element={
                  <ProtectedRoute>
                    <JobAnalysis />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/jobs/:id/generate-cv" 
                element={
                  <ProtectedRoute>
                    <GenerateCV />
                  </ProtectedRoute>
                } 
              />
              <Route path="/payment/callback" element={<PaymentCallback />} />
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <Navigate to="/jobs" replace />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/applications" 
                element={
                  <ProtectedRoute>
                    <Applications />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/help" 
                element={
                  <ProtectedRoute>
                    <Help />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/admin-portal" 
                element={<AdminPortal />}
              />
              <Route 
                path="*" 
                element={<Navigate to="/" replace />} 
              />
            </Routes>
          </NotificationsProvider>
        </AuthProvider>
      </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
