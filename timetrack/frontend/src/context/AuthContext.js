import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme]     = useState(localStorage.getItem('tt_theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('tt_theme', theme);
  }, [theme]);

  useEffect(() => {
    const token = localStorage.getItem('tt_token');
    const cached = localStorage.getItem('tt_user');
    if (token && cached) {
      try { setUser(JSON.parse(cached)); } catch {}
    }
    if (token) {
      authAPI.getMe()
        .then(r => { setUser(r.data.data); localStorage.setItem('tt_user', JSON.stringify(r.data.data)); })
        .catch(() => { localStorage.removeItem('tt_token'); localStorage.removeItem('tt_user'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authAPI.login({ email, password });
    const { token, user: u } = res.data.data;
    localStorage.setItem('tt_token', token);
    localStorage.setItem('tt_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (data) => {
    const res = await authAPI.register(data);
    const { token, user: u } = res.data.data;
    localStorage.setItem('tt_token', token);
    localStorage.setItem('tt_user', JSON.stringify(u));
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((updated) => {
    setUser(prev => ({ ...prev, ...updated }));
    localStorage.setItem('tt_user', JSON.stringify({ ...user, ...updated }));
  }, [user]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <AuthContext.Provider value={{ user, loading, theme, login, register, logout, updateUser, toggleTheme }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
