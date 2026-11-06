import axios from 'axios';

export const origin = import.meta.env.VITE_API_URL || 'http://localhost:5000';
export const fileUrl = (p) => (p ? (p.startsWith('http') ? p : origin + p) : null);

const api = axios.create({ baseURL: `${origin}/api` });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // expired / invalid session on a protected call: clear it and send the user to login
    if (err.response?.status === 401 && localStorage.getItem('token') && !err.config.url.includes('/auth/')) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export default api;
