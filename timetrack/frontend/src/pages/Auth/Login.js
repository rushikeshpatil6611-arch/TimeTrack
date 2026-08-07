import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'admin' ? '/admin/dashboard' : '/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'admin') setForm({ email: 'admin@timetrack.com', password: 'Admin@123' });
    else setForm({ email: 'user@timetrack.com', password: 'User@1234' });
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in">
        <div className="auth-logo">⏱ TimeTrack</div>
        <div className="auth-subtitle">Sign in to your account</div>

        {/* Demo Buttons */}
        <div className="d-flex gap-2 mb-4">
          <button className="btn-ghost flex-fill" style={{fontSize:'0.75rem',padding:'6px 12px'}} onClick={() => fillDemo('admin')}>
            <i className="bi bi-shield-fill" /> Demo Admin
          </button>
          <button className="btn-ghost flex-fill" style={{fontSize:'0.75rem',padding:'6px 12px'}} onClick={() => fillDemo('user')}>
            <i className="bi bi-person-fill" /> Demo User
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-envelope" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--dark-muted)' }} />
              <input
                className="form-input" name="email" type="email" required
                placeholder="you@company.com" value={form.email} onChange={handleChange}
                style={{ paddingLeft: 36 }}
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <i className="bi bi-lock" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--dark-muted)' }} />
              <input
                className="form-input" name="password" type={showPw ? 'text' : 'password'} required
                placeholder="••••••••" value={form.password} onChange={handleChange}
                style={{ paddingLeft: 36, paddingRight: 40 }}
              />
              <button type="button" onClick={() => setShowPw(p => !p)} style={{
                position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                background:'none',border:'none',color:'var(--dark-muted)',cursor:'pointer'
              }}>
                <i className={`bi ${showPw ? 'bi-eye-slash' : 'bi-eye'}`} />
              </button>
            </div>
          </div>

          <div className="d-flex justify-content-between align-items-center mb-4">
            <div />
            <Link to="/forgot-password" style={{ fontSize:'0.8rem',color:'var(--primary)',textDecoration:'none' }}>Forgot password?</Link>
          </div>

          <button type="submit" className="btn-primary-custom w-100 justify-content-center" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Signing in…</> : 'Sign In'}
          </button>
        </form>

        <div className="text-center mt-4" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
        </div>
      </div>
    </div>
  );
}
