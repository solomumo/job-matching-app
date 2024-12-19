import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);

  const login = (userData, tokens) => {
    setIsAuthenticated(true);
    setUser(userData);
    setTokens(tokens);
    // Store tokens in localStorage
    localStorage.setItem('tokens', JSON.stringify(tokens));
  };

  const logout = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/auth/logout/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokens.access}`
        },
        body: JSON.stringify({
          refresh: tokens.refresh
        })
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsAuthenticated(false);
      setUser(null);
      setTokens(null);
      localStorage.removeItem('tokens');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      user, 
      tokens,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext); 