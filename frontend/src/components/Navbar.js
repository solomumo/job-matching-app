import { useState } from 'react';
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

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
    { icon: <WorkIcon />, text: 'My Jobs', path: '/jobs' },
    { icon: <TuneIcon />, text: 'Preferences', path: '/preferences' },
    { icon: <HelpIcon />, text: 'Help', path: '/help' },
  ];

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
                    onClick={() => navigate(item.path)}
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
          <IconButton
            size="large"
            onClick={() => navigate('/notifications')}
            sx={{ 
              color: '#384347',
              borderBottom: isActive('/notifications') ? '2px solid #2ecc71' : '2px solid transparent',
              borderRadius: 0,
              padding: '6px 12px',
              '&:hover': { 
                bgcolor: 'rgba(107, 89, 204, 0.08)'
              }
            }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Button
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
            sx={{ mt: 1 }}
          >
            <MenuItem onClick={() => { handleClose(); navigate('/plans'); }}>
              Plans
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/account'); }}>
              Account
            </MenuItem>
            <MenuItem onClick={handleLogout}>
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

