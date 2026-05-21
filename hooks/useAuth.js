import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const router = useRouter();
  const [status, setStatus] = useState('pending');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      setStatus('authenticated');
    } else if (redirectIfUnauthenticated) {
      router.replace('/login');
    } else {
      setStatus('unauthenticated');
    }
  }, [redirectIfUnauthenticated, router]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setStatus('authenticated');
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setStatus('unauthenticated');
    router.replace('/login');
  };

  const isAuthenticated = status === 'authenticated';
  const loading =
    status === 'pending' || (redirectIfUnauthenticated && status !== 'authenticated');

  return { login, logout, isAuthenticated, loading, isLoading: loading };
}
