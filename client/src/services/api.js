import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach token and active user ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('splitmate_token');
    const activeUserId = localStorage.getItem('splitmate_user_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (activeUserId) {
      config.headers.Authorization = `Bearer mock_${activeUserId}`;
    }

    if (activeUserId) {
      config.headers['x-user-id'] = activeUserId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Lỗi mạng hoặc máy chủ không phản hồi';
    return Promise.reject(new Error(message));
  }
);

export default api;
