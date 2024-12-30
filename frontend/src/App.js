import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Plans from './pages/Plans';
import Preferences from './pages/Preferences';
import Jobs from './pages/Jobs';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import JobAnalysis from './pages/JobAnalysis';
import PaymentCallback from './pages/PaymentCallback';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Navbar />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/jobs" 
            element={
              <ProtectedRoute>
                <Jobs />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/plans" 
            element={
              <ProtectedRoute>
                <Plans />
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
            path="*" 
            element={<Navigate to="/" replace />} 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
