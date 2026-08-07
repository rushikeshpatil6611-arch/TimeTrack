import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Request interceptor — attach token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('tt_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('tt_token');
      localStorage.removeItem('tt_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────
export const authAPI = {
  login:          (data)    => api.post('/auth/login', data),
  register:       (data)    => api.post('/auth/register', data),
  forgotPassword: (email)   => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)    => api.post('/auth/reset-password', data),
  getMe:          ()        => api.get('/auth/me'),
  changePassword: (data)    => api.post('/auth/change-password', data),
};

// ── Sessions ──────────────────────────────────────────────
export const sessionAPI = {
  getAll:       (params) => api.get('/sessions', { params }),
  getActive:    ()       => api.get('/sessions/active'),
  getStats:     (params) => api.get('/sessions/stats', { params }),
  start:        (data)   => api.post('/sessions/start', data),
  stop:         (id, data) => api.patch(`/sessions/${id}/stop`, data),
  pause:        (id)     => api.patch(`/sessions/${id}/pause`),
  resume:       (id)     => api.patch(`/sessions/${id}/resume`),
  delete:       (id)     => api.delete(`/sessions/${id}`),
};

// ── Users ─────────────────────────────────────────────────
export const userAPI = {
  getAll:         (params) => api.get('/users', { params }),
  getById:        (id)     => api.get(`/users/${id}`),
  create:         (data)   => api.post('/users', data),
  update:         (id, data) => api.put(`/users/${id}`, data),
  toggleStatus:   (id)     => api.patch(`/users/${id}/toggle-status`),
  delete:         (id)     => api.delete(`/users/${id}`),
};

// ── Categories ────────────────────────────────────────────
export const categoryAPI = {
  getAll:   ()          => api.get('/categories'),
  create:   (data)      => api.post('/categories', data),
  update:   (id, data)  => api.put(`/categories/${id}`, data),
  delete:   (id)        => api.delete(`/categories/${id}`),
};

// ── Reports ───────────────────────────────────────────────
export const reportAPI = {
  get: (params) => api.get('/reports', { params }),
};

// ── Alerts ────────────────────────────────────────────────
export const alertAPI = {
  getAll:     ()   => api.get('/alerts'),
  markRead:   (id) => api.patch(`/alerts/${id}/read`),
  markAllRead:()   => api.patch('/alerts/mark-all-read'),
};

// ── Admin ─────────────────────────────────────────────────
export const adminAPI = {
  getDashboard:  ()        => api.get('/admin/dashboard'),
  getLiveSessions: ()      => api.get('/admin/live-sessions'),
  getAnalytics:  (params)  => api.get('/admin/analytics', { params }),
};

// ── Settings ──────────────────────────────────────────────
export const settingsAPI = {
  get:    ()     => api.get('/settings'),
  update: (data) => api.put('/settings', data),
};
