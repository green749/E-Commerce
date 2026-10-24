import { create } from 'zustand';
import apiClient from '../api/axios.js';

const STORAGE_KEY = 'shoppe_auth_state';

// Load initial state from localStorage if present
const getInitialState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        user: parsed.user || null,
        accessToken: parsed.accessToken || null,
        isAuthenticated: !!parsed.accessToken,
        isLoading: false,
        error: null,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
  };
};

export const useAuthStore = create((set, get) => ({
  ...getInitialState(),

  /**
   * Set authentication credentials
   * @param {Object} user
   * @param {string} accessToken
   */
  setAuth: (user, accessToken) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
    } catch {
      // Ignore storage errors
    }
    set({
      user,
      accessToken,
      isAuthenticated: true,
      error: null,
    });
  },

  /**
   * Update only the access token (used during silent token refresh)
   * @param {string} accessToken
   */
  setAccessToken: (accessToken) => {
    const { user } = get();
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, accessToken }));
    } catch {
      // Ignore storage errors
    }
    set({ accessToken, isAuthenticated: true });
  },

  /**
   * Clear all authentication data
   */
  clearAuth: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage errors
    }
    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  /**
   * Login action
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   */
  login: async ({ email, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/login', { email, password });
      get().setAuth(data.user, data.accessToken);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      throw err;
    }
  },

  /**
   * Register action
   * @param {Object} userData
   */
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/register', userData);
      get().setAuth(data.user, data.accessToken);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      throw err;
    }
  },

  /**
   * Logout action
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // Proceed with local logout regardless of network response
    } finally {
      get().clearAuth();
    }
  },

  /**
   * Check current user profile from /api/me
   */
  checkAuth: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    try {
      const user = await apiClient.get('/me');
      set({ user, isAuthenticated: true });
    } catch {
      // Silently handled by axios interceptor
    }
  },

  /**
   * Request password reset token
   * @param {string} email
   */
  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/forgot-password', { email });
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Request failed' });
      throw err;
    }
  },

  /**
   * Reset password with token
   * @param {Object} payload
   */
  resetPassword: async ({ token, password }) => {
    set({ isLoading: true, error: null });
    try {
      const data = await apiClient.post('/auth/reset-password', { token, password });
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Reset failed' });
      throw err;
    }
  },
}));

export default useAuthStore;
