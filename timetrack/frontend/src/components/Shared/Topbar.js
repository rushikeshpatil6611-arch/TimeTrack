import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { alertAPI } from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

export default function Topbar({ title, onMenuClick }) {
  const { user, theme, toggleTheme } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    alertAPI.getAll()
      .then(r => { setAlerts(r.data.data || []); setUnread(r.data.unread_count || 0); })
      .catch(() => {});
  }, []);

  const handleMarkAllRead = async () => {
    await alertAPI.markAllRead().catch(() => {});
    setUnread(0);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: 1 })));
  };

  return (
    <div className="topbar">
      <div className="d-flex align-items-center gap-3">
        <button className="btn-ghost d-md-none" style={{ padding: '8px', border: 'none' }} onClick={onMenuClick}>
          <i className="bi bi-list" style={{ fontSize: '1.2rem' }} />
        </button>
        <h1 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{title}</h1>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Theme Toggle */}
        <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={toggleTheme}>
          <i className={`bi ${theme === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill'}`} />
        </button>

        {/* Alerts Bell */}
        <div style={{ position: 'relative' }}>
          <button className="btn-ghost" style={{ padding: '8px 12px' }} onClick={() => setShowAlerts(!showAlerts)}>
            <i className="bi bi-bell-fill" />
            {unread > 0 && (
              <span style={{
                position:'absolute',top:4,right:4,width:16,height:16,
                background:'var(--danger)',borderRadius:'50%',
                fontSize:'0.6rem',fontWeight:700,color:'#fff',
                display:'flex',alignItems:'center',justifyContent:'center'
              }}>{unread > 9 ? '9+' : unread}</span>
            )}
          </button>
          {showAlerts && (
            <div style={{
              position:'absolute',right:0,top:'calc(100% + 8px)',
              width:320,background:'var(--dark-card)',border:'1px solid var(--dark-border)',
              borderRadius:14,boxShadow:'var(--shadow)',zIndex:200,overflow:'hidden'
            }}>
              <div className="d-flex align-items-center justify-content-between p-3" style={{borderBottom:'1px solid var(--dark-border)'}}>
                <span style={{fontWeight:700,fontSize:'0.875rem'}}>Notifications</span>
                {unread > 0 && <button className="btn-ghost" style={{fontSize:'0.75rem',padding:'4px 8px'}} onClick={handleMarkAllRead}>Mark all read</button>}
              </div>
              <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div className="empty-state" style={{padding:'24px'}}>
                    <div className="empty-icon">🔔</div>
                    <p style={{margin:0,fontSize:'0.875rem'}}>No notifications</p>
                  </div>
                ) : alerts.slice(0, 8).map(alert => (
                  <div key={alert.id} style={{
                    padding:'12px 16px',borderBottom:'1px solid var(--glass-border)',
                    background: alert.is_read ? 'transparent' : 'rgba(99,102,241,0.05)',
                    cursor:'pointer'
                  }}>
                    <div style={{fontSize:'0.82rem',fontWeight:600,marginBottom:2}}>{alert.title}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-secondary)'}}>{alert.message}</div>
                    <div style={{fontSize:'0.68rem',color:'var(--dark-muted)',marginTop:4}}>{formatDateTime(alert.created_at)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User */}
        <div className="d-flex align-items-center gap-2" style={{ paddingLeft: 8, borderLeft: '1px solid var(--dark-border)' }}>
          <div className="avatar sm" style={{ fontSize: '0.68rem' }}>
            {user?.name?.slice(0,2).toUpperCase()}
          </div>
          <div className="d-none d-md-block">
            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{user?.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
        </div>
      </div>

      {showAlerts && <div style={{ position: 'fixed', inset: 0, zIndex: 150 }} onClick={() => setShowAlerts(false)} />}
    </div>
  );
}
