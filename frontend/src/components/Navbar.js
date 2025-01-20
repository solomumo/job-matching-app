import { useState, useEffect } from 'react';
import { 
  AppBar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
  Badge,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WorkIcon from '@mui/icons-material/Work';
import TuneIcon from '@mui/icons-material/Tune';
import HelpIcon from '@mui/icons-material/Help';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsMenu from './NotificationsMenu';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, isLoading, tokens } = useAuth();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Fetch subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const response = await api.get('/api/payments/get-subscription/', {
          headers: {
            ...api.defaults.headers,
            'Authorization': `Bearer ${tokens?.access}`,
          },
        });
        
        if (response.data && response.data.is_active && response.data.plan) {
          setSubscription(response.data);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && tokens?.access) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, tokens?.access]);

  const handleProfileClick = (event) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setProfileAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleMobileMenuClick = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  const isActive = (path) => location.pathname === path;

  // Don't render anything while loading
  if (isLoading || loading) {
    return null;
  }

  // If not authenticated, render minimal navbar with just logo
  if (!isAuthenticated) {
    return (
      <Box 
        sx={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          p: 3,
          zIndex: 1000
        }}
      >
        <Typography
          variant="h6"
          onClick={() => navigate('/')}
          sx={{
            color: '#6b59cc',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '20px'
          }}
        >
          LOGO
        </Typography>
      </Box>
    );
  }

  const navigationItems = [
    { icon: <WorkIcon />, text: 'My Jobs', path: '/jobs', tourId: 'jobs' },
    { 
      icon: <DescriptionIcon />, 
      text: 'My Applications', 
      path: '/applications',
      tourId: 'applications'
    },
    { icon: <TuneIcon />, text: 'Preferences', path: '/preferences', tourId: 'preferences' },
    { icon: <HelpIcon />, text: 'Help', path: '/help', tourId: 'help' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  };

  const mobileDrawer = (
    <Drawer
      anchor="left"
      open={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    >
      <Box sx={{ width: 250 }}>
        <List>
          {navigationItems.map((item) => (
            <ListItem 
              button 
              key={item.text}
              onClick={() => handleMobileMenuClick(item.path)}
              sx={{
                borderLeft: isActive(item.path) ? '4px solid #2ecc71' : '4px solid transparent',
                bgcolor: isActive(item.path) ? 'rgba(107, 89, 204, 0.08)' : 'transparent',
              }}
            >
              <ListItemIcon sx={{ color: '#384347' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  color: '#384347',
                  '& .MuiTypography-root': {
                    fontSize: '14px',
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );

  return (
    <AppBar position="static" sx={{ bgcolor: '#ffffff', boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)' }}>
      <Toolbar>
        {/* Logo and Mobile Menu Icon */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ color: '#384347' }}
            >
              <MenuIcon />
            </IconButton>
          )}
          <Typography
            variant="h6"
            onClick={() => navigate('/')}
            sx={{
              color: '#6b59cc',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '20px',
              mr: isMobile ? 2 : 6
            }}
          >
            LOGO
          </Typography>
        </Box>

        {/* Navigation Items - Only visible when authenticated and not mobile */}
        {isAuthenticated && !isMobile && (
          <>
            {/* Left Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <Box sx={{ display: 'flex', gap: 4 }}>
                {navigationItems.map((item) => (
                  <Button
                    key={item.text}
                    startIcon={item.icon}
                    onClick={() => handleNavigation(item.path)}
                    data-tour={item.tourId}
                    sx={{
                      color: '#384347',
                      textTransform: 'none',
                      fontSize: '14px',
                      borderBottom: isActive(item.path) ? '2px solid #2ecc71' : '2px solid transparent',
                      borderRadius: 0,
                      padding: '6px 12px',
                      '&:hover': { 
                        bgcolor: 'rgba(107, 89, 204, 0.08)'
                      }
                    }}
                  >
                    {item.text}
                  </Button>
                ))}
              </Box>
            </Box>
          </>
        )}

        {/* Right Section - User Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 'auto' }}>
          <Box className="notifications">
            <NotificationsMenu />
          </Box>

          <Button
            className="profile-menu"
            startIcon={<AccountCircleIcon />}
            endIcon={<KeyboardArrowDownIcon />}
            onClick={handleProfileClick}
            sx={{
              color: '#384347',
              textTransform: 'none',
              fontSize: '14px',
              padding: '6px 12px',
              '&:hover': { 
                bgcolor: 'rgba(107, 89, 204, 0.08)'
              }
            }}
          >
            {!isMobile && 'Profile'}
          </Button>

          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleClose}
            sx={{
              mt: 1,
              '& .MuiPaper-root': {
                borderRadius: 2,
                minWidth: 180,
                boxShadow: 'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
                '& .MuiMenu-list': {
                  padding: '4px 0',
                },
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem 
              onClick={() => { 
                handleClose(); 
                navigate('/plans'); 
              }}
              sx={{
                fontSize: '14px',
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(107, 89, 204, 0.08)',
                }
              }}
            >
              Plans & Pricing
            </MenuItem>
            <MenuItem 
              onClick={() => { handleClose(); navigate('/account'); }}
              sx={{
                fontSize: '14px',
                py: 1,
                px: 2,
                '&:hover': {
                  backgroundColor: 'rgba(107, 89, 204, 0.08)',
                }
              }}
            >
              Account
            </MenuItem>
            <MenuItem 
              onClick={handleLogout}
              sx={{
                fontSize: '14px',
                py: 1,
                px: 2,
                color: '#ef4444',
                '&:hover': {
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                }
              }}
            >
              Log Out
            </MenuItem>
          </Menu>
        </Box>

        {/* Mobile Drawer */}
        {mobileDrawer}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

