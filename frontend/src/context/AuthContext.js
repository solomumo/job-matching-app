import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Define logout with useCallback
  const logout = useCallback(() => {
    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);
    // Clear data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('authData');
  }, []);

  // Initialize state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');
    const authData = localStorage.getItem('authData');

    if (token && refreshToken && storedUser && authData) {
      const parsedAuthData = JSON.parse(authData);
      if (!isTokenExpired(parsedAuthData.expiresAt)) {
        setIsAuthenticated(true);
        setTokens({ access: token, refresh: refreshToken });
        setUser(JSON.parse(storedUser));
      } else {
        logout(); // Use the stable reference of logout
      }
    }
    setIsLoading(false); // Mark loading as complete
  }, [logout]);

  // Check token expiration periodically
  useEffect(() => {
    const checkTokenExpiration = () => {
      const authData = JSON.parse(localStorage.getItem('authData'));
      if (authData && isTokenExpired(authData.expiresAt)) {
        logout(); // Use the stable reference of logout
        navigate('/login');
      }
    };

    const intervalId = setInterval(checkTokenExpiration, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [logout, navigate]);

  // Logout user after inactivity
  useEffect(() => {
    let inactivityTimer;

    const logoutOnInactivity = () => {
      logout(); // Use the stable reference of logout
      navigate('/login');
    };

    const resetInactivityTimer = () => {
      if (inactivityTimer) clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(logoutOnInactivity, 15 * 60 * 1000); // 15 minutes
    };

    const activityEvents = ['mousemove', 'keydown', 'scroll', 'click'];
    activityEvents.forEach(event =>
      window.addEventListener(event, resetInactivityTimer)
    );

    resetInactivityTimer();

    return () => {
      activityEvents.forEach(event =>
        window.removeEventListener(event, resetInactivityTimer)
      );
      if (inactivityTimer) clearTimeout(inactivityTimer);
    };
  }, [logout, navigate]);

  const login = (userData, tokens) => {
    const expiresAt = tokens.expiresAt || new Date().getTime() + 60 * 60 * 1000; // Default to 1 hour
    setUser(userData);
    setTokens(tokens);
    setIsAuthenticated(true);
    // Store data in localStorage
    localStorage.setItem('token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem(
      'authData',
      JSON.stringify({ expiresAt })
    );
  };

  const isTokenExpired = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date().getTime() > expiresAt;
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log('Google token response:', tokenResponse);
        
        const res = await fetch('http://localhost:8000/api/auth/google/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: tokenResponse.access_token
          }),
        });

        console.log('Response status:', res.status);
        const data = await res.json();
        console.log('Backend response:', data);
        
        if (res.ok) {
          login(data.user, {
            access: data.token,
            refresh: data.refresh,
            expiresAt: new Date().getTime() + (60 * 60 * 1000)
          });
          navigate('/jobs');
        } else {
          throw new Error(data.error || 'Google authentication failed');
        }
      } catch (error) {
        console.error('Authentication error:', {
          message: error.message,
          fullError: error
        });
        setError(error.message);
      }
    },
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setError('Google authentication failed');
    },
    scope: 'email profile',
    flow: 'implicit'
  });

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        tokens,
        login,
        logout,
        isLoading,
        error,
        setError,
        handleGoogleLogin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
