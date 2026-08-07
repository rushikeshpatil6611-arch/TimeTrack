import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';

const adminNav = [
  { to: '/admin/dashboard',   icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { to: '/admin/users',       icon: 'bi-people-fill',          label: 'Users' },
  { to: '/admin/sessions',    icon: 'bi-clock-history',        label: 'Sessions' },
  { to: '/admin/categories',  icon: 'bi-tag-fill',             label: 'Categories' },
  { to: '/admin/analytics',   icon: 'bi-bar-chart-fill',       label: 'Analytics' },
  { to: '/admin/reports',     icon: 'bi-file-earmark-bar-graph-fill', label: 'Reports' },
  { to: '/admin/settings',    icon: 'bi-gear-fill',            label: 'Settings' },
];

const userNav = [
  { to: '/dashboard',         icon: 'bi-grid-1x2-fill',       label: 'Dashboard' },
  { to: '/tracker',           icon: 'bi-play-circle-fill',    label: 'Time Tracker' },
  { to: '/sessions',          icon: 'bi-clock-history',       label: 'My Sessions' },
  { to: '/reports',           icon: 'bi-file-earmark-bar-graph-fill', label: 'Reports' },
  { to: '/profile',           icon: 'bi-person-fill',         label: 'Profile' },
];

export default function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const nav = user?.role === 'admin' ? adminNav : userNav;

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo d-flex align-items-center justify-content-between">
        <div>
          <div className="brand">Time<span>Track</span></div>
          <div style={{ fontSize: '0.7rem', color: 'var(--dark-muted)', marginTop: 2 }}>
            {user?.role === 'admin' ? '⚡ Admin Panel' : '👤 Employee Portal'}
          </div>
        </div>
        <button className="btn-ghost d-md-none" style={{padding:'6px 8px'}} onClick={onClose}>
          <i className="bi bi-x-lg" />
        </button>
      </div>

      {/* Nav */}
      <nav className="nav-section flex-grow-1 pt-2">
        <div className="nav-section-label">Navigation</div>
        {nav.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <i className={`bi ${item.icon} nav-icon`} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div style={{ padding: '16px', borderTop: '1px solid var(--dark-border)' }}>
        <div className="d-flex align-items-center gap-3 mb-3">
          <div className="avatar">{getInitials(user?.name)}</div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{user?.email}</div>
          </div>
        </div>
        <button className="nav-item w-100" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
          <i className="bi bi-box-arrow-right nav-icon" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
