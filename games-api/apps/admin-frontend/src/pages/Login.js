import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Tabs,
  Tab,
  Toolbar
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const { t } = useTranslation();
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleTogglePassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (tabValue === 0) {
        // Login
        if (!email || !password) {
          setError(t('please_fill_in_all_fields', { defaultValue: 'Please fill in all fields' }));
          setLoading(false);
          return;
        }
        result = await login(email, password);
      } else {
        // Register
        if (!email || !password || !name) {
          setError(t('please_fill_in_all_fields', { defaultValue: 'Please fill in all fields' }));
          setLoading(false);
          return;
        }
        result = await register(email, password, name);
      }

      if (result.success) {
        navigate('/');
      } else {
        // Try to translate error message, fallback to original
        const errorKey = result.error?.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        setError(t(errorKey, { defaultValue: result.error || t('authentication_failed', { defaultValue: 'Authentication failed' }) }));
      }
    } catch (err) {
      setError(err.message || t('an_error_occurred', { defaultValue: 'An error occurred. Please try again.' }));
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Toolbar>
            <Box
              component="img"
              src="/asharq-logo.svg"
              alt="Asharq Logo"
              sx={{
                height: 40,
                width: 'auto',
                flexGrow: 1,
              }}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </Toolbar>
          <Typography component="h1" variant="h4" align="center" gutterBottom>
            {t('admin_dashboard')}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary" gutterBottom>
            {t('asharq_games_management')}
          </Typography>

          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
            <Tab label={t('login')} />
            <Tab label={t('register')} />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {tabValue === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label={t('name')}
                name="name"
                autoComplete="name"
                autoFocus
                value={name}
                onChange={(e) => {
                  const value = e.target.value
                    .replace(/^\s+/, '')
                    .replace(/\s{2,}/g, ' ');
                  setName(value);
                }}
                onBlur={() => setName((prev) => prev.trim())}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email_address')}
              name="email"
              autoComplete="email"
              autoFocus={tabValue === 0}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePassword}
                      edge="end"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? t('processing', { defaultValue: 'Processing...' }) : tabValue === 0 ? t('sign_in') : t('sign_up')}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;

