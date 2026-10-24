import apiClient from './axios.js';

export const userApi = {
  getProfile: async () => {
    return apiClient.get('/me');
  },

  updateProfile: async (data) => {
    return apiClient.patch('/me', data);
  },

  getAddresses: async () => {
    return apiClient.get('/me/addresses');
  },

  createAddress: async (data) => {
    return apiClient.post('/me/addresses', data);
  },

  updateAddress: async (id, data) => {
    return apiClient.patch(`/me/addresses/${id}`, data);
  },

  deleteAddress: async (id) => {
    return apiClient.delete(`/me/addresses/${id}`);
  },

  updatePassword: async (data) => {
    return apiClient.patch('/me/password', data);
  },
};

export default userApi;
