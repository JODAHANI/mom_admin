import axios from 'axios';
import Router from 'next/router';

function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  try {
    return window?.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

function resolveApiBase() {
  // 네이티브 앱은 .env의 NEXT_PUBLIC_API_URL보다 우선 — 빌드 시 DCE되지 않도록 순서 중요
  if (isCapacitorNative()) return 'http://10.0.2.2:5001';
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return 'https://mom-store-server-production.up.railway.app';
}

const api = axios.create();

api.interceptors.request.use((config) => {
  // baseURL을 매 요청마다 동적으로 — Capacitor 네이티브 여부 런타임 판단
  config.baseURL = `${resolveApiBase()}/api`;

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
