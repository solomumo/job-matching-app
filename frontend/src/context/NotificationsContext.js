import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import notificationsApi from '../services/notificationsApi';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const { isAuthenticated, tokens } = useAuth();

  const fetchNotifications = async (resetPage = false) => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      const currentPage = resetPage ? 1 : page;
      const response = await notificationsApi.getAll(currentPage);
      
      // Ensure we're working with arrays
      const newNotifications = response.results || [];
      
      setNotifications(prev => 
        currentPage === 1 ? newNotifications : [...prev, ...newNotifications]
      );
      setHasMore(!!response.next);
      setPage(currentPage + 1);
      setUnreadCount(newNotifications.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await notificationsApi.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications(true);
      
      // Poll for updates every 30 minutes
      const pollInterval = setInterval(() => {
        notificationsApi.getUnreadCount().then(setUnreadCount);
      }, 1800000);

      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated]);

  return (
    <NotificationsContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      error,
      hasMore,
      markAsRead,
      markAllAsRead,
      loadMore,
      fetchNotifications
    }}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}; 