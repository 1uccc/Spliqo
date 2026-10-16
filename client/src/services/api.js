import axios from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://spliqo-backend.onrender.com/api'
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let pendingCount = 0;
let wakingTimer = null;

// Interceptor to attach token and active user ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spliqo_token');
    const activeUserId = localStorage.getItem('spliqo_user_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (import.meta.env.DEV && activeUserId) {
      // Development mock authentication only
      config.headers.Authorization = `Bearer mock_${activeUserId}`;
      config.headers['x-user-id'] = activeUserId;
    }

    pendingCount++;
    if (pendingCount === 1 && typeof window !== 'undefined' && navigator.onLine) {
      wakingTimer = setTimeout(() => {
        window.dispatchEvent(new CustomEvent('spliqo:server-waking'));
      }, 2000);
    }

    return config;
  },
  (error) => {
    pendingCount = Math.max(0, pendingCount - 1);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    pendingCount = Math.max(0, pendingCount - 1);
    if (pendingCount === 0 && wakingTimer) {
      clearTimeout(wakingTimer);
      wakingTimer = null;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('spliqo:server-ready'));
      }
    }
    return response.data;
  },
  (error) => {
    pendingCount = Math.max(0, pendingCount - 1);
    if (pendingCount === 0 && wakingTimer) {
      clearTimeout(wakingTimer);
      wakingTimer = null;
    }
    const message = error.response?.data?.error || error.message || 'Lỗi mạng hoặc máy chủ không phản hồi';
    return Promise.reject(new Error(message));
  }
);

export default api;
