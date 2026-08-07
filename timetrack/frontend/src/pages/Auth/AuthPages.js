import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI } from '../../services/api';
import { toast } from 'react-toastify';

// ── Register ───────────────────────────────────────────────
export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name:'', email:'', password:'', department:'', position:'' });
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form);
      toast.success('Account created! Welcome!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 460 }}>
        <div className="auth-logo">⏱ TimeTrack</div>
        <div className="auth-subtitle">Create your account</div>
        <form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-12">
              <label className="form-label">Full Name *</label>
              <input className="form-input" name="name" required placeholder="John Doe" value={form.name} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Email Address *</label>
              <input className="form-input" name="email" type="email" required placeholder="john@company.com" value={form.email} onChange={handleChange} />
            </div>
            <div className="col-12">
              <label className="form-label">Password *</label>
              <input className="form-input" name="password" type="password" required placeholder="Min 6 chars, letter+number" value={form.password} onChange={handleChange} />
            </div>
            <div className="col-6">
              <label className="form-label">Department</label>
              <input className="form-input" name="department" placeholder="Engineering" value={form.department} onChange={handleChange} />
            </div>
            <div className="col-6">
              <label className="form-label">Position</label>
              <input className="form-input" name="position" placeholder="Developer" value={form.position} onChange={handleChange} />
            </div>
          </div>
          <button type="submit" className="btn-primary-custom w-100 justify-content-center" disabled={loading}>
            {loading ? <><span className="spinner-border spinner-border-sm me-2" />Creating…</> : 'Create Account'}
          </button>
        </form>
        <div className="text-center mt-4" style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

// ── Forgot Password ────────────────────────────────────────
export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authAPI.forgotPassword(email);
      setSent(true);
      toast.success('Reset instructions sent (check console in dev mode)');
    } catch (err) {
      toast.error('Something went wrong');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 400 }}>
        <div className="auth-logo">⏱ TimeTrack</div>
        <div className="auth-subtitle">Reset your password</div>
        {sent ? (
          <div style={{ textAlign: 'center', color: 'var(--success)' }}>
            <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem' }} />
            <p className="mt-3">Check your email for reset instructions.</p>
            <Link to="/login" style={{ color: 'var(--primary)' }}>Back to login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label">Email Address</label>
              <input className="form-input" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" />
            </div>
            <button type="submit" className="btn-primary-custom w-100 justify-content-center" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}
        <div className="text-center mt-4">
          <Link to="/login" style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>← Back to login</Link>
        </div>
      </div>
    </div>
  );
}

// ── Reset Password ─────────────────────────────────────────
export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();
  const token          = searchParams.get('token') || '';
  const [form, setForm] = useState({ token, password: '', confirm: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await authAPI.resetPassword({ token: form.token, password: form.password });
      toast.success('Password reset successfully!');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-in" style={{ maxWidth: 400 }}>
        <div className="auth-logo">⏱ TimeTrack</div>
        <div className="auth-subtitle">Set new password</div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Reset Token</label>
            <input className="form-input" value={form.token} onChange={e => setForm(f => ({...f, token: e.target.value}))} placeholder="Paste token here" required />
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input className="form-input" type="password" required value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="Min 6 characters" />
          </div>
          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input className="form-input" type="password" required value={form.confirm} onChange={e => setForm(f => ({...f, confirm: e.target.value}))} placeholder="Repeat password" />
          </div>
          <button type="submit" className="btn-primary-custom w-100 justify-content-center" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
