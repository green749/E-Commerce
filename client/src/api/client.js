import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore.js';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 & token refresh
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => {
    // API returns { success, data, error }
    if (response.data && response.data.success !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized for token refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;
      if (!refreshToken) {
        useAuthStore.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        const newTokens = res.data?.data?.tokens || res.data?.tokens;
        if (newTokens?.accessToken) {
          useAuthStore.getState().setTokens(newTokens);
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${newTokens.accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
          processQueue(null, newTokens.accessToken);
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        useAuthStore.getState().logout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Extract standardized API error message
    const apiError = error.response?.data?.error;
    const errorMessage = apiError?.message || error.message || 'Network request failed';
    const customError = new Error(errorMessage);
    customError.code = apiError?.code || 'REQUEST_FAILED';
    customError.details = apiError?.details || null;
    customError.status = error.response?.status;

    return Promise.reject(customError);
  }
);

// Modular API services
export const authApi = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (data) => apiClient.post('/auth/login', data),
  logout: (refreshToken) => apiClient.post('/auth/logout', { refresh_token: refreshToken }),
  getMe: () => apiClient.get('/auth/me'),
};

export const productsApi = {
  list: (params) => apiClient.get('/products', { params }),
  getOne: (idOrSlug) => apiClient.get(`/products/${idOrSlug}`),
  create: (data) => apiClient.post('/products', data),
  update: (id, data) => apiClient.put(`/products/${id}`, data),
  delete: (id) => apiClient.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => apiClient.get('/categories'),
  getOne: (slug) => apiClient.get(`/categories/${slug}`),
};

export const ordersApi = {
  create: (data) => apiClient.post('/orders', data),
  getOne: (id) => apiClient.get(`/orders/${id}`),
  getByNumber: (orderNumber) => apiClient.get(`/orders/track/${orderNumber}`),
  getMyOrders: () => apiClient.get('/orders/my-orders'),
  listAll: (params) => apiClient.get('/orders', { params }),
  updateStatus: (id, status) => apiClient.patch(`/orders/${id}/status`, { status }),
};

export const paymentsApi = {
  createOrder: (orderId) => apiClient.post('/payments/create-order', { order_id: orderId }),
  verifyPayment: (data) => apiClient.post('/payments/verify', data),
};

export const userApi = {
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/profile', data),
  getAddresses: () => apiClient.get('/users/addresses'),
  addAddress: (data) => apiClient.post('/users/addresses', data),
};
