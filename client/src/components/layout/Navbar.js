import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
} from '@mui/material';
import ChatbotModal from '../chatbot/ChatbotModal';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileMenuAnchorEl, setMobileMenuAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenu = (event) => {
    setMobileMenuAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMobileClose = () => {
    setMobileMenuAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/login');
  };

  return (
    <>
    <AppBar position="static">
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to={isAuthenticated ? '/dashboard' : '/'}
          sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}
        >
          <AccountBalanceWalletIcon sx={{ mr: 1 }} />
          Xpense
        </Typography>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
          <IconButton
            size="large"
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={handleMobileMenu}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={mobileMenuAnchorEl}
            open={Boolean(mobileMenuAnchorEl)}
            onClose={handleMobileClose}
          >
            {isAuthenticated ? (
              <>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/dashboard'); }}>
                  Dashboard
                </MenuItem>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/expenses'); }}>
                  Expenses
                </MenuItem>

                <MenuItem onClick={() => { handleMobileClose(); navigate('/community'); }}>
                  Community
                </MenuItem>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/daily-saving'); }}>
                  Daily Saving
                </MenuItem>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/bookstore'); }}>
                  Book Store
                </MenuItem>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/wallet'); }}>
                  Wallet
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </>
            ) : (
              <>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/login'); }}>
                  Login
                </MenuItem>
                <MenuItem onClick={() => { handleMobileClose(); navigate('/signup'); }}>
                  Sign Up
                </MenuItem>
              </>
            )}
          </Menu>
        </Box>

        {/* Desktop menu */}
        <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
          {isAuthenticated ? (
            <>
              <Button color="inherit" component={Link} to="/dashboard">
                Dashboard
              </Button>
              <Button color="inherit" component={Link} to="/expenses">
                Expenses
              </Button>

              <Button color="inherit" component={Link} to="/community">
                Community
              </Button>
              <Button color="inherit" component={Link} to="/daily-saving">
                Daily Saving
              </Button>
              <Button color="inherit" component={Link} to="/bookstore">
                Book Store
              </Button>
              <Button color="inherit" component={Link} to="/wallet">
                Wallet
              </Button>
              <IconButton
                size="large"
                edge="end"
                color="inherit"
                aria-label="account"
                onClick={handleMenu}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleLogout}>Logout</MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button color="inherit" component={Link} to="/login">
                Login
              </Button>
              <Button color="inherit" variant="outlined" component={Link} to="/signup">
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
    <ChatbotModal />
    </>
  );
};

export default Navbar;