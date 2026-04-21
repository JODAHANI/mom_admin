import axios from 'axios';

const port = process.env.NEXT_PUBLIC_API_PORT || 5001;
const host = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const api = axios.create({ baseURL: `http://${host}:${port}/api` });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
