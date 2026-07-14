import axios from 'axios';

const host = window.location.hostname;
const port = import.meta.env.VITE_API_PORT || '5001';
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || `http://${host}:${port}/api`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
