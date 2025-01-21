import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu,
  MenuItem,
  IconButton,
  Badge,
  Typography,
  Box,
  Button,
  Divider,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import CampaignIcon from '@mui/icons-material/Campaign';
import PaymentIcon from '@mui/icons-material/Payment';
import { useNotifications } from '../context/NotificationsContext';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import InfiniteScroll from 'react-infinite-scroll-component';
import CircularProgress from '@mui/material/CircularProgress';
import { styled } from '@mui/material/styles';

const getNotificationIcon = (type) => {
  const iconStyle = { fontSize: 'small', color: '#6b59cc' };
  
  switch (type) {
    case 'JOB_MATCH':
      return <WorkIcon sx={iconStyle} />;
    case 'APPLICATION_UPDATE':
      return <DescriptionIcon sx={iconStyle} />;
    case 'SUBSCRIPTION':
      return <PaymentIcon sx={iconStyle} />;
    default:
      return <CampaignIcon sx={iconStyle} />;
  }
};

const NotificationItem = ({ notification, onClick }) => (
  <MenuItem
    onClick={onClick}
    sx={{
      py: 1.5,
      px: 2,
      backgroundColor: notification.is_read ? 'inherit' : 'action.hover',
      '&:hover': {
        backgroundColor: notification.is_read ? 'action.hover' : 'action.selected',
      }
    }}
  >
    <Box sx={{ display: 'flex', alignItems: 'flex-start', width: '100%' }}>
      <ListItemIcon sx={{ minWidth: 40, mt: 0.5, color: 'primary.main' }}>
        {getNotificationIcon(notification.notification_type)}
      </ListItemIcon>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="subtitle2" noWrap>
          {notification.title}
        </Typography>
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 0.5
          }}
        >
          {notification.message}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
        </Typography>
      </Box>
    </Box>
  </MenuItem>
);

// Add styled component for scrollable menu
const StyledMenu = styled(Menu)(({ theme }) => ({
  '& .MuiPaper-root': {
    maxHeight: '250px', // Set a reasonable max height
    overflowY: 'auto',  // Enable vertical scrolling
    width: '300px',
  }
}));

const NotificationsMenu = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead,
    loading,
    hasMore,
    loadMore 
  } = useNotifications();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    await markAsRead(notification.id);
    handleClose();
    
    switch (notification.notification_type) {
      case 'JOB_MATCH':
        navigate('/jobs');
        break;
      case 'APPLICATION_UPDATE':
        navigate('/applications');
        break;
      case 'SUBSCRIPTION':
        navigate('/subscription');
        break;
      default:
        // For other types, just mark as read without navigation
        break;
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleClick}
        sx={{ 
          color: '#384347',
          '&:hover': { 
            backgroundColor: 'rgba(107, 89, 204, 0.08)'
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              backgroundColor: '#ef4444',
            }
          }}
        >
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <StyledMenu
        marginThreshold={0}
        id="notifications-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'notifications-button',
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box 
          sx={{ 
            p: 2, 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button 
              size="small" 
              onClick={markAllAsRead}
              sx={{ 
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(107, 89, 204, 0.08)'
                }
              }}
            >
              Mark all as read
            </Button>
          )}
        </Box>

        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <InfiniteScroll
            dataLength={notifications.length}
            next={loadMore}
            hasMore={hasMore}
            height={300}
            scrollableTarget="notifications-menu-list"
            style={{ maxHeight: '300px' }}
            loader={
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            }
          >
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
              />
            ))}
          </InfiniteScroll>
        )}
      </StyledMenu>
    </>
  );
};

export default NotificationsMenu; 