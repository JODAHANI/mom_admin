import axios from 'axios';
import Router from 'next/router';

const apiURL =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://mom-store-server-production.up.railway.app';
const api = axios.create({ baseURL: `${apiURL}/api` });

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!config.url?.startsWith('/auth/')) {
      return Promise.reject({ __skipped: true, message: 'No auth token' });
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.__skipped) return Promise.reject(error);
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('token');
      if (Router.pathname !== '/login') {
        Router.replace('/login');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
