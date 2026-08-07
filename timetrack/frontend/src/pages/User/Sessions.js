import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Shared/Layout';
import { SkeletonTable, EmptyState, ConfirmModal, Badge } from '../../components/Shared/UIComponents';
import { sessionAPI, categoryAPI } from '../../services/api';
import { formatDurationHuman, formatDateTime, formatTime } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function MySessions() {
  const [sessions, setSessions]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0 });
  const [filters, setFilters]     = useState({ status: '', category_id: '', from: '', to: '' });
  const [deleteId, setDeleteId]   = useState(null);

  const loadSessions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await sessionAPI.getAll(params);
      setSessions(res.data.data || []);
      setPagination(p => ({ ...p, page, total: res.data.pagination?.total || 0 }));
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, [filters, pagination.limit]);

  useEffect(() => { loadSessions(1); categoryAPI.getAll().then(r => setCategories(r.data.data || [])); }, []);

  const handleDelete = async () => {
    try {
      await sessionAPI.delete(deleteId);
      toast.success('Session deleted');
      setDeleteId(null);
      loadSessions(pagination.page);
    } catch { toast.error('Delete failed'); }
  };

  const statusBadge = (s) => {
    const map = { active:'success', paused:'warning', completed:'primary', cancelled:'danger' };
    return <Badge type={map[s] || 'muted'}>{s}</Badge>;
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Layout title="My Sessions">
      {/* Filters */}
      <div className="card-glass p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label">Status</label>
            <select className="form-input" value={filters.status} onChange={e => setFilters(f => ({...f,status:e.target.value}))}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="col-6 col-md-3">
            <label className="form-label">Category</label>
            <select className="form-input" value={filters.category_id} onChange={e => setFilters(f => ({...f,category_id:e.target.value}))}>
              <option value="">All</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">From</label>
            <input type="date" className="form-input" value={filters.from} onChange={e => setFilters(f => ({...f,from:e.target.value}))} />
          </div>
          <div className="col-6 col-md-2">
            <label className="form-label">To</label>
            <input type="date" className="form-input" value={filters.to} onChange={e => setFilters(f => ({...f,to:e.target.value}))} />
          </div>
          <div className="col-12 col-md-2">
            <button className="btn-primary-custom w-100 justify-content-center" onClick={() => loadSessions(1)}>
              <i className="bi bi-search" /> Search
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} /> : sessions.length === 0 ? (
        <div className="card-glass"><EmptyState icon="⏰" title="No sessions found" description="Start tracking your work time" /></div>
      ) : (
        <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-custom w-100">
              <thead>
                <tr>
                  <th>Title</th><th>Category</th><th>Start</th><th>End</th><th>Duration</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 500 }}>{s.title || 'Work Session'}</td>
                    <td>
                      {s.category_name ? (
                        <span className="d-flex align-items-center gap-1">
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.category_color, display: 'inline-block' }} />
                          {s.category_name}
                        </span>
                      ) : <span style={{ color: 'var(--dark-muted)' }}>—</span>}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{formatDateTime(s.start_time)}</td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.82rem' }}>{s.end_time ? formatDateTime(s.end_time) : '—'}</td>
                    <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {s.total_duration ? formatDurationHuman(s.total_duration) : '—'}
                    </td>
                    <td>{statusBadge(s.status)}</td>
                    <td>
                      <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => setDeleteId(s.id)}>
                        <i className="bi bi-trash" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between p-3" style={{ borderTop: '1px solid var(--dark-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {pagination.total} sessions total
              </span>
              <div className="d-flex gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => loadSessions(p)}
                    className={p === pagination.page ? 'btn-primary-custom' : 'btn-ghost'}
                    style={{ padding: '4px 10px', minWidth: 36, justifyContent: 'center' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ConfirmModal
        open={!!deleteId} danger title="Delete Session"
        message="Are you sure you want to delete this session? This action cannot be undone."
        onConfirm={handleDelete} onCancel={() => setDeleteId(null)}
      />
    </Layout>
  );
}
