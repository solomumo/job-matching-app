import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state from localStorage if available
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  // Add this state to track loading
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Add this useEffect to check localStorage when the app loads
  useEffect(() => {
    const token = localStorage.getItem('token');
    const refreshToken = localStorage.getItem('refresh_token');
    const storedUser = localStorage.getItem('user');

    if (token && refreshToken && storedUser) {
      setIsAuthenticated(true);
      setTokens({ access: token, refresh: refreshToken });
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);  // Mark loading as complete
  }, []);

  // Add this effect to check token expiration
  useEffect(() => {
    const checkTokenExpiration = () => {
      const authData = JSON.parse(localStorage.getItem('authData'));
      if (authData && isTokenExpired(authData.expiresAt)) {
        logout();
        navigate('/login');
      }
    };

    const intervalId = setInterval(checkTokenExpiration, 60000); // Check every minute
    return () => clearInterval(intervalId);
  }, [navigate]);

  const login = (userData, tokens) => {
    setUser(userData);
    setTokens(tokens);
    setIsAuthenticated(true);
    // Store the token and user data
    localStorage.setItem('token', tokens.access);
    localStorage.setItem('refresh_token', tokens.refresh);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    setIsAuthenticated(false);
    // Clear stored tokens
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
  };

  // Add this function to check token expiration
  const isTokenExpired = (expiresAt) => {
    if (!expiresAt) return true;
    return new Date().getTime() > expiresAt;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      tokens,
      login, 
      logout,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 