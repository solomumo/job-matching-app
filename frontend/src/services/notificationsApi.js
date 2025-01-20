import api from './api';

const NOTIFICATIONS_URL = '/api/notifications';

const notificationsApi = {
  // Get all notifications with optional pagination
  getAll: async (page = 1, limit = 20) => {
    try {
      const response = await api.get(NOTIFICATIONS_URL, {
        params: { page, limit }
      });
      console.log('Fetched notifications:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  // Get unread count
  getUnreadCount: async () => {
    const response = await api.get(`${NOTIFICATIONS_URL}/unread_count/`);
    return response.data.count;
  },

  // Mark single notification as read
  markAsRead: async (notificationId) => {
    const response = await api.post(`${NOTIFICATIONS_URL}/${notificationId}/mark_read/`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await api.post(`${NOTIFICATIONS_URL}/mark_all_read/`);
    return response.data;
  }
};

export default notificationsApi; 