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
  Badge
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationsIcon from '@mui/icons-material/Notifications';
import WorkIcon from '@mui/icons-material/Work';
import TuneIcon from '@mui/icons-material/Tune';
import HelpIcon from '@mui/icons-material/Help';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [profileAnchorEl, setProfileAnchorEl] = useState(null);

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

  const isActive = (path) => location.pathname === path;

  return (
    <AppBar position="static" sx={{ 
      bgcolor: '#ffffff',
      boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <Toolbar>
        {/* Logo - Always visible */}
        <Typography
          variant="h6"
          onClick={() => navigate('/')}
          sx={{
            color: '#6b59cc',
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: '20px',
            mr: 6
          }}
        >
          LOGO
        </Typography>

        {/* Navigation Items - Only visible when authenticated */}
        {isAuthenticated && (
          <>
            {/* Left Section */}
            <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              {/* Main Navigation Items */}
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Button
                  startIcon={<WorkIcon />}
                  onClick={() => navigate('/jobs')}
                  sx={{
                    color: '#384347',
                    textTransform: 'none',
                    fontSize: '14px',
                    borderBottom: isActive('/jobs') ? '2px solid #2ecc71' : '2px solid transparent',
                    borderRadius: 0,
                    padding: '6px 12px',
                    '&:hover': { 
                      bgcolor: 'rgba(107, 89, 204, 0.08)'
                    }
                  }}
                >
                  My Jobs
                </Button>

                <Button
                  startIcon={<TuneIcon />}
                  onClick={() => navigate('/preferences')}
                  sx={{
                    color: '#384347',
                    textTransform: 'none',
                    fontSize: '14px',
                    borderBottom: isActive('/preferences') ? '2px solid #2ecc71' : '2px solid transparent',
                    borderRadius: 0,
                    padding: '6px 12px',
                    '&:hover': { 
                      bgcolor: 'rgba(107, 89, 204, 0.08)'
                    }
                  }}
                >
                  Preferences
                </Button>

                <Button
                  startIcon={<HelpIcon />}
                  onClick={() => navigate('/help')}
                  sx={{
                    color: '#384347',
                    textTransform: 'none',
                    fontSize: '14px',
                    borderBottom: isActive('/help') ? '2px solid #2ecc71' : '2px solid transparent',
                    borderRadius: 0,
                    padding: '6px 12px',
                    '&:hover': { 
                      bgcolor: 'rgba(107, 89, 204, 0.08)'
                    }
                  }}
                >
                  Help
                </Button>
              </Box>
            </Box>

            {/* Right Section - User Actions */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                Profile
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
          </>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;

