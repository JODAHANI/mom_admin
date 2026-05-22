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

const PRODUCTION_API = 'https://mom-store-server-production.up.railway.app';

function resolveApiBase() {
  // 네이티브 앱은 실기기 설치 가능 → 프로덕션 고정. 에뮬레이터 로컬 테스트 시 임시로 10.0.2.2 로 바꿔 사용.
  if (isCapacitorNative()) return PRODUCTION_API;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  return PRODUCTION_API;
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
