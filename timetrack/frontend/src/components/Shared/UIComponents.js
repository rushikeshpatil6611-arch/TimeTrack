import React from 'react';

// Skeleton Loader
export const SkeletonCard = ({ height = 120 }) => (
  <div className="card-glass p-3">
    <div className="skeleton mb-2" style={{ height: 16, width: '40%' }} />
    <div className="skeleton mb-2" style={{ height: height * 0.5 }} />
    <div className="skeleton" style={{ height: 12, width: '60%' }} />
  </div>
);

export const SkeletonTable = ({ rows = 5 }) => (
  <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="d-flex gap-3 p-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
        <div className="skeleton" style={{ height: 36, width: 36, borderRadius: 10 }} />
        <div className="flex-grow-1">
          <div className="skeleton mb-1" style={{ height: 14, width: '50%' }} />
          <div className="skeleton" style={{ height: 12, width: '30%' }} />
        </div>
        <div className="skeleton" style={{ height: 24, width: 80, borderRadius: 20 }} />
      </div>
    ))}
  </div>
);

// Stat Card
export const StatCard = ({ icon, label, value, subValue, color = 'primary', trend }) => (
  <div className="stat-card fade-in">
    <div className="d-flex align-items-start justify-content-between mb-3">
      <div className="icon-wrap" style={{ background: `rgba(var(--${color}-rgb,99,102,241),0.15)` }}>
        <i className={`bi ${icon}`} style={{ color: `var(--${color})` }} />
      </div>
      {trend !== undefined && (
        <span className={`trend ${trend >= 0 ? 'up' : 'down'}`}>
          <i className={`bi bi-arrow-${trend >= 0 ? 'up' : 'down'}-right`} /> {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="value">{value}</div>
    <div className="label">{label}</div>
    {subValue && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 6 }}>{subValue}</div>}
  </div>
);

// Empty State
export const EmptyState = ({ icon = '📭', title = 'Nothing here', description, action }) => (
  <div className="empty-state">
    <div className="empty-icon">{icon}</div>
    <h5>{title}</h5>
    {description && <p style={{ fontSize: '0.875rem', margin: '8px 0 20px' }}>{description}</p>}
    {action}
  </div>
);

// Confirm Modal
export const ConfirmModal = ({ open, title, message, onConfirm, onCancel, danger }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth: 400 }}>
        <h5 style={{ marginBottom: 12 }}>{title}</h5>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>{message}</p>
        <div className="d-flex gap-3 justify-content-end">
          <button className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={danger ? 'btn-danger-custom' : 'btn-primary-custom'} onClick={onConfirm}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

// Badge
export const Badge = ({ children, type = 'primary' }) => (
  <span className={`badge-custom badge-${type}`}>{children}</span>
);

// Loading Spinner
export const Spinner = ({ size = 24 }) => (
  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{
      width: size, height: size, border: '2px solid var(--dark-border)',
      borderTopColor: 'var(--primary)', borderRadius: '50%',
      animation: 'spin 0.7s linear infinite'
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Avatar
export const Avatar = ({ name = '', size = 'md' }) => (
  <div className={`avatar ${size}`}>
    {name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
  </div>
);
