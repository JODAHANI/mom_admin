import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

export function useAuth({ redirectIfUnauthenticated = true } = {}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      setLoading(false);
    } else {
      setIsAuthenticated(false);
      setLoading(false);
      if (redirectIfUnauthenticated) {
        router.push('/login');
      }
    }
  }, [redirectIfUnauthenticated, router]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setIsAuthenticated(true);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    router.push('/login');
  };

  return { login, logout, isAuthenticated, loading };
}
