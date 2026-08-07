import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { reportAPI, userAPI } from '../../services/api';
import { formatDurationHuman, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

// Guard against ms values from MySQL
const safeSec = (val) => {
  const n = Number(val) || 0;
  return n > 86400 * 365 * 10 ? Math.floor(n / 1000) : n;
};

const toHours = (val) => (safeSec(val) / 3600).toFixed(1);

const avgProductivity = (val) => {
  const v = parseFloat(val) || 0;
  return v > 0 ? v.toFixed(1) + '/10' : '—';
};

export default function AdminReports() {
  const [data, setData]       = useState(null);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [params, setParams]   = useState({ type: 'weekly', userId: '', from: '', to: '' });

  useEffect(() => {
    userAPI.getAll({ limit: 200 }).then(r => setUsers(r.data.data || [])).catch(() => {});
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const p = { ...params };
      if (!p.userId) delete p.userId;
      const res = await reportAPI.get(p);
      setData(res.data.data);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!data?.sessions?.length) { toast.warning('No data to export'); return; }
    const headers = ['Title', 'Category', 'User', 'Date', 'Duration (hrs)', 'Status'];
    const rows = data.sessions.map(s => [
      `"${s.title || 'Work Session'}"`,
      `"${s.category_name || ''}"`,
      `"${s.user_name || ''}"`,
      formatDate(s.start_time),
      toHours(s.total_duration),
      s.status
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timetrack-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported!');
  };

  const summaryCards = [
    { label: 'Sessions',          value: Number(data?.summary?.total_sessions) || 0,      icon: 'bi-collection-fill', color: '#6366f1' },
    { label: 'Total Hours',       value: toHours(data?.summary?.total_seconds) + 'h',      icon: 'bi-clock-fill',      color: '#10b981' },
    { label: 'Avg Productivity',  value: avgProductivity(data?.summary?.avg_productivity), icon: 'bi-star-fill',       color: '#f59e0b' },
    { label: 'Active Days',       value: data?.by_day?.length || 0,                        icon: 'bi-calendar-check',  color: '#06b6d4' },
  ];

  return (
    <Layout title="Reports">

      {/* Filters */}
      <div className="card-glass p-4 mb-4">
        <div className="row g-3 align-items-end">
          <div className="col-6 col-md-2">
            <label className="form-label">Type</label>
            <select className="form-input" value={params.type} onChange={e => setParams(p => ({ ...p, type: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Employee</label>
            <select className="form-input" value={params.userId} onChange={e => setParams(p => ({ ...p, userId: e.target.value }))}>
              <option value="">All Employees</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
          </div>
          {params.type === 'custom' && <>
            <div className="col-6 col-md-2">
              <label className="form-label">From</label>
              <input type="date" className="form-input" value={params.from} onChange={e => setParams(p => ({ ...p, from: e.target.value }))} />
            </div>
            <div className="col-6 col-md-2">
              <label className="form-label">To</label>
              <input type="date" className="form-input" value={params.to} onChange={e => setParams(p => ({ ...p, to: e.target.value }))} />
            </div>
          </>}
          <div className="col-6 col-md-2">
            <button className="btn-primary-custom w-100 justify-content-center" onClick={load}>
              {loading
                ? <span className="spinner-border spinner-border-sm" />
                : <><i className="bi bi-bar-chart-fill" /> Generate</>}
            </button>
          </div>
          {data && (
            <div className="col-6 col-md-2">
              <button className="btn-ghost w-100 justify-content-center" onClick={exportCSV}>
                <i className="bi bi-download" /> CSV
              </button>
            </div>
          )}
        </div>
      </div>

      {data && (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {summaryCards.map((s, i) => (
              <div key={i} className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="icon-wrap mb-2" style={{ background: s.color + '22' }}>
                    <i className={`bi ${s.icon}`} style={{ color: s.color }} />
                  </div>
                  <div className="value">{s.value}</div>
                  <div className="label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Sessions Table */}
          {data.sessions?.length > 0 && (
            <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
              <div className="d-flex align-items-center justify-content-between p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700 }}>Sessions ({data.sessions.length})</h6>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {formatDate(data.period?.start)} — {formatDate(data.period?.end)}
                </span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table-custom w-100">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Date</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.sessions.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s.user_name || '—'}</td>
                        <td style={{ fontSize: '0.82rem' }}>{s.title || 'Work Session'}</td>
                        <td style={{ fontSize: '0.82rem' }}>
                          {s.category_name ? (
                            <span className="d-flex align-items-center gap-1">
                              <span style={{ width: 7, height: 7, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                              {s.category_name}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '0.8rem' }}>{formatDate(s.start_time)}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600, fontSize: '0.82rem' }}>
                          {formatDurationHuman(safeSec(s.total_duration))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}