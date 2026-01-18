import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button
} from '@mui/material';
import {
  RssFeed,
  Article,
  Settings,
  Logout,
  SportsEsports
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

const drawerWidth = 240;

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { text: t('feeds'), icon: <RssFeed />, path: '/feeds' },
    { text: t('feed_articles'), icon: <Article />, path: '/feedarticles' },
    { text: t('feed_settings'), icon: <Settings />, path: '/settings' },
    { text: t('game_settings'), icon: <SportsEsports />, path: '/game-settings' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <Box
            component="img"
            src="/asharq-logo.svg"
            alt="Asharq Logo"
            sx={{
              height: 40,
              width: 'auto',
              marginInlineEnd: 2
            }}
            onError={(e) => {
              // Fallback if logo doesn't exist
              e.target.style.display = 'none';
            }}
          />
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {t('asharq_games_management')}
          </Typography>
          <LanguageSwitcher />
          <Typography variant="body2" sx={{ marginInlineStart: 2, marginInlineEnd: 2 }}>
            {user?.name || user?.email}
          </Typography>
          <Button color="inherit" onClick={handleLogout} startIcon={<Logout />} sx={{ marginInlineStart: 2 }}>
            {t('logout')}
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  selected={location.pathname === item.path}
                  onClick={() => navigate(item.path)}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Dashboard;

