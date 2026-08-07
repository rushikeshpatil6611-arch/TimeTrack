import React, { useState } from 'react';
import Layout from '../../components/Shared/Layout';
import { useAuth } from '../../context/AuthContext';
import { userAPI, authAPI } from '../../services/api';
import { getInitials, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user?.name||'', department: user?.department||'', position: user?.position||'', phone: user?.phone||'' });
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirm:'' });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await userAPI.update(user.id, form);
      updateUser(res.data.data);
      toast.success('Profile updated!');
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setSavingPw(true);
    try {
      await authAPI.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password changed!');
      setPwForm({ currentPassword:'', newPassword:'', confirm:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSavingPw(false); }
  };

  return (
    <Layout title="My Profile">
      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-12 col-md-4">
          <div className="card-glass p-4 text-center">
            <div className="avatar lg mx-auto mb-3" style={{ width: 72, height: 72, fontSize: '1.4rem' }}>
              {getInitials(user?.name)}
            </div>
            <h5 style={{ fontWeight: 700 }}>{user?.name}</h5>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 4 }}>{user?.email}</p>
            <span className="badge-custom badge-primary" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            <hr style={{ borderColor: 'var(--dark-border)', margin: '20px 0' }} />
            <div className="text-start">
              {[
                { icon: 'bi-building', label: user?.department || '—' },
                { icon: 'bi-briefcase', label: user?.position || '—' },
                { icon: 'bi-telephone', label: user?.phone || '—' },
                { icon: 'bi-calendar3', label: `Joined ${formatDate(user?.created_at)}` },
                { icon: 'bi-clock', label: `Last login ${formatDate(user?.last_login)}` },
              ].map((item, i) => (
                <div key={i} className="d-flex align-items-center gap-2 mb-2">
                  <i className={`bi ${item.icon}`} style={{ color: 'var(--primary)', width: 16 }} />
                  <span style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Edit Forms */}
        <div className="col-12 col-md-8">
          <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
            {/* Tabs */}
            <div className="d-flex" style={{ borderBottom: '1px solid var(--dark-border)' }}>
              {['profile', 'password'].map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  padding: '14px 24px', background: 'none', border: 'none',
                  color: activeTab === tab ? 'var(--primary)' : 'var(--text-secondary)',
                  fontWeight: activeTab === tab ? 700 : 500, fontSize: '0.875rem',
                  borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                  cursor: 'pointer', textTransform: 'capitalize'
                }}>{tab}</button>
              ))}
            </div>

            <div className="p-4">
              {activeTab === 'profile' ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Full Name *</label>
                      <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f,name:e.target.value}))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department</label>
                      <input className="form-input" value={form.department} onChange={e => setForm(f => ({...f,department:e.target.value}))} placeholder="Engineering" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Position</label>
                      <input className="form-input" value={form.position} onChange={e => setForm(f => ({...f,position:e.target.value}))} placeholder="Developer" />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Phone</label>
                      <input className="form-input" value={form.phone} onChange={e => setForm(f => ({...f,phone:e.target.value}))} placeholder="+1 234 567 8900" />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn-primary-custom" disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2" />Saving…</> : <><i className="bi bi-check2" /> Save Changes</>}
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePw}>
                  <div className="row g-3">
                    <div className="col-12">
                      <label className="form-label">Current Password</label>
                      <input type="password" className="form-input" value={pwForm.currentPassword} onChange={e => setPwForm(f => ({...f,currentPassword:e.target.value}))} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-input" value={pwForm.newPassword} onChange={e => setPwForm(f => ({...f,newPassword:e.target.value}))} required placeholder="Min 6 chars" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-input" value={pwForm.confirm} onChange={e => setPwForm(f => ({...f,confirm:e.target.value}))} required />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn-primary-custom" disabled={savingPw}>
                        {savingPw ? 'Changing…' : <><i className="bi bi-shield-lock" /> Change Password</>}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
