import api from './api';

const AUTH_URL = '/api/auth';

const authApi = {
  login: async (credentials) => {
    const response = await api.post(`${AUTH_URL}/login/`, credentials);
    
    // Store auth data in localStorage
    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refresh_token', response.data.refresh);
    localStorage.setItem('user', JSON.stringify(response.data.user));
    localStorage.setItem('authData', JSON.stringify({
      expiresAt: new Date().getTime() + (60 * 60 * 1000) // 1 hour
    }));

    return {
      user: response.data.user,
      tokens: {
        access: response.data.token,
        refresh: response.data.refresh
      }
    };
  },

  logout: async () => {
    try {
      const refresh = localStorage.getItem('refresh_token');
      await api.post(`${AUTH_URL}/logout/`, { refresh });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      localStorage.removeItem('authData');
    }
  },

  // Add other auth-related API calls here
};

export default authApi; 