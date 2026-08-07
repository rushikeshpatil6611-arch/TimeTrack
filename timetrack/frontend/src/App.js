import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, NotFound } from './components/Shared/ProtectedRoute';

// Auth Pages
import Login from './pages/Auth/Login';
import { Register, ForgotPassword, ResetPassword } from './pages/Auth/AuthPages';

// User Pages
import UserDashboard  from './pages/User/Dashboard';
import Tracker        from './pages/User/Tracker';
import MySessions     from './pages/User/Sessions';
import UserReports    from './pages/User/Reports';
import Profile        from './pages/User/Profile';

// Admin Pages
import AdminDashboard   from './pages/Admin/Dashboard';
import AdminUsers       from './pages/Admin/Users';
import AdminSessions    from './pages/Admin/Sessions';
import AdminCategories  from './pages/Admin/Categories';
import AdminAnalytics   from './pages/Admin/Analytics';
import AdminReports     from './pages/Admin/Reports';
import AdminSettings    from './pages/Admin/Settings';

// Root redirect based on role
function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/"               element={<RootRedirect />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password"  element={<ResetPassword />} />

          {/* User Routes */}
          <Route path="/dashboard" element={<ProtectedRoute><UserDashboard /></ProtectedRoute>} />
          <Route path="/tracker"   element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
          <Route path="/sessions"  element={<ProtectedRoute><MySessions /></ProtectedRoute>} />
          <Route path="/reports"   element={<ProtectedRoute><UserReports /></ProtectedRoute>} />
          <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard"   element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users"       element={<ProtectedRoute adminOnly><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/sessions"    element={<ProtectedRoute adminOnly><AdminSessions /></ProtectedRoute>} />
          <Route path="/admin/categories"  element={<ProtectedRoute adminOnly><AdminCategories /></ProtectedRoute>} />
          <Route path="/admin/analytics"   element={<ProtectedRoute adminOnly><AdminAnalytics /></ProtectedRoute>} />
          <Route path="/admin/reports"     element={<ProtectedRoute adminOnly><AdminReports /></ProtectedRoute>} />
          <Route path="/admin/settings"    element={<ProtectedRoute adminOnly><AdminSettings /></ProtectedRoute>} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'var(--dark-card)',
          border: '1px solid var(--dark-border)',
          borderRadius: 12,
          color: 'var(--text-primary)',
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: '0.875rem',
        }}
      />
    </AuthProvider>
  );
}

export default App;
