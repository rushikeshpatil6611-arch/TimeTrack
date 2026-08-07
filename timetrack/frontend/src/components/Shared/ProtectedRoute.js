import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Protected Route
export function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ width:48,height:48,border:'3px solid var(--dark-border)',borderTopColor:'var(--primary)',borderRadius:'50%',animation:'spin 0.7s linear infinite',margin:'0 auto 16px' }} />
        <div style={{ color:'var(--text-secondary)',fontSize:'0.875rem' }}>Loading…</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return children;
}

// 404 Page
export function NotFound() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--dark)', textAlign:'center', padding:24 }}>
      <div>
        <div style={{ fontSize:'6rem', fontWeight:800, background:'linear-gradient(135deg,var(--primary),var(--info))', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1 }}>404</div>
        <h2 style={{ marginTop:16, marginBottom:8 }}>Page Not Found</h2>
        <p style={{ color:'var(--text-secondary)', marginBottom:32 }}>The page you're looking for doesn't exist or was moved.</p>
        <a href="/" style={{ display:'inline-flex',alignItems:'center',gap:8,background:'linear-gradient(135deg,var(--primary),var(--primary-dark))',color:'#fff',padding:'10px 24px',borderRadius:10,textDecoration:'none',fontWeight:600 }}>
          ← Go Home
        </a>
      </div>
    </div>
  );
}
