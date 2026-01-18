import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('admin_token');
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      localStorage.removeItem('admin_token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      if (response.data && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Login failed' };
    } catch (error) {
      // Use the error message from backend (already user-friendly)
      const errorMessage = error.message || 'Login failed';
      return { success: false, error: errorMessage, errorCode: error.errorCode };
    }
  };

  const register = async (email, password, name) => {
    try {
      const response = await authAPI.register(email, password, name);
      if (response.data && response.data.user) {
        setUser(response.data.user);
        return { success: true };
      }
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      // Map error codes to user-friendly messages for registration
      let errorMessage = error.message || 'Registration failed';
      if (error.errorCode === 204) { // alreadyExists
        errorMessage = 'User is already registered';
      } else if (error.errorCode === 202) { // invalidEmail
        errorMessage = 'Invalid email format';
      } else if (error.errorCode === 203) { // weakPassword
        errorMessage = error.message || 'Password does not meet requirements';
      }
      return { success: false, error: errorMessage, errorCode: error.errorCode };
    }
  };

  const logout = () => {
    authAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

