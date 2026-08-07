import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Layout from '../../components/Shared/Layout';
import { sessionAPI, categoryAPI } from '../../services/api';
import { formatDuration, formatDurationHuman, formatDateTime } from '../../utils/helpers';
import { toast } from 'react-toastify';

// Parse MySQL datetime — since backend uses timezone:'local', do NOT add Z
// Just replace the space with T so JS Date() parses it as local time
const parseServerTimestamp = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value);
  const text = String(value).trim();
  if (!text) return null;
  // If already has timezone info (Z or +offset), parse as-is
  // If no timezone info, parse as LOCAL time (no Z suffix)
  const hasTimezone = text.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(text);
  const normalized = hasTimezone ? text : text.replace(' ', 'T');
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getElapsedSeconds = (startTime, pauseDuration = 0) => {
  const startDate = parseServerTimestamp(startTime);
  if (!startDate) return 0;
  const elapsed = Math.floor((Date.now() - startDate.getTime()) / 1000);
  return Math.max(0, elapsed - (Number(pauseDuration) || 0));
};

const formatStartTime = (value) => {
  const date = parseServerTimestamp(value);
  if (!date) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export default function Tracker() {
  const [active, setActive]           = useState(null);
  const [categories, setCategories]   = useState([]);
  const [sessions, setSessions]       = useState([]);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [form, setForm]               = useState({ category_id: '', title: '', notes: '' });
  const [score, setScore]             = useState('');
  const intervalRef                   = useRef(null);

  const activeStartDate = useMemo(
    () => parseServerTimestamp(active?.start_time),
    [active?.start_time]
  );

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (active && active.status === 'active' && activeStartDate) {
      const update = () => setLiveSeconds(getElapsedSeconds(active.start_time, active.pause_duration));
      update(); // run immediately
      intervalRef.current = setInterval(update, 1000);
    } else if (active && active.status === 'paused') {
      setLiveSeconds(getElapsedSeconds(active.start_time, active.pause_duration));
    } else {
      setLiveSeconds(0);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [active, activeStartDate]);

  const loadAll = useCallback(async () => {
    try {
      const [activeRes, catRes, sessRes] = await Promise.all([
        sessionAPI.getActive(),
        categoryAPI.getAll(),
        sessionAPI.getAll({ limit: 5, status: 'completed' }),
      ]);
      const session = activeRes.data.data;
      setActive(session);
      setCategories(catRes.data.data || []);
      setSessions(sessRes.data.data || []);
    } catch {
      toast.error('Failed to load tracker data');
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleStart = async () => {
    if (!form.title.trim()) { toast.warning('Please add a session title'); return; }
    try {
      await sessionAPI.start(form);
      toast.success('Tracking started!');
      setForm({ category_id: '', title: '', notes: '' });
      await loadAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleStop = async () => {
    if (!active) return;
    try {
      await sessionAPI.stop(active.id, { productivity_score: score || null });
      toast.success('Session saved!');
      setScore('');
      setLiveSeconds(0);
      await loadAll();
    } catch {
      toast.error('Failed to stop session');
    }
  };

  const handlePauseResume = async () => {
    if (!active) return;
    try {
      if (active.status === 'active') {
        await sessionAPI.pause(active.id);
        toast.info('Session paused');
      } else {
        await sessionAPI.resume(active.id);
        toast.success('Session resumed');
      }
      await loadAll();
    } catch {
      toast.error('Action failed');
    }
  };

  const targetSeconds = 8 * 3600;
  const progressPct   = Math.min(100, (liveSeconds / targetSeconds) * 100);

  return (
    <Layout title="Time Tracker">
      <div className="row g-4">

        {/* Main Timer */}
        <div className="col-12 col-lg-7">
          <div className="timer-card mb-4">

            <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
              <span className={`timer-status-badge ${active ? active.status : 'idle'}`}>
                <span className="dot" />
                {active ? (active.status === 'active' ? '● Live' : '⏸ Paused') : '○ Idle'}
              </span>
              {active?.category_name && (
                <span className="badge-custom badge-primary">
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: active.category_color, display: 'inline-block' }} />
                  {active.category_name}
                </span>
              )}
            </div>

            <div className="timer-display mb-2">{formatDuration(liveSeconds)}</div>

            {active && (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: 0 }}>
                <strong>{active.title}</strong> · Started {formatStartTime(active.start_time)}
              </p>
            )}

            <div className="mt-4 mb-2">
              <div className="d-flex justify-content-between mb-1" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                <span>Daily Goal (8h)</span>
                <span>{Math.round(progressPct)}%</span>
              </div>
              <div className="progress-bar-custom" style={{ height: 8 }}>
                <div className="progress-bar-fill" style={{ width: progressPct + '%' }} />
              </div>
            </div>

            {!active ? (
              <div className="d-flex gap-2 justify-content-center mt-4">
                <button className="btn-success-custom" style={{ fontSize: '1rem', padding: '14px 32px' }} onClick={handleStart}>
                  <i className="bi bi-play-circle-fill" /> Start Session
                </button>
              </div>
            ) : (
              <div className="d-flex gap-2 justify-content-center mt-4 flex-wrap">
                <button className="btn-ghost" onClick={handlePauseResume} style={{ padding: '12px 24px' }}>
                  <i className={`bi ${active.status === 'active' ? 'bi-pause-circle-fill' : 'bi-play-circle-fill'}`} />
                  {active.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="btn-danger-custom" onClick={handleStop} style={{ padding: '12px 24px' }}>
                  <i className="bi bi-stop-circle-fill" /> Stop & Save
                </button>
              </div>
            )}
          </div>

          {active && (
            <div className="card-glass p-4 mb-4">
              <label className="form-label">Productivity Score (1–10, optional)</label>
              <input type="number" min="1" max="10" className="form-input"
                placeholder="Rate how productive you were (1–10)"
                value={score} onChange={e => setScore(e.target.value)} />
            </div>
          )}

          {!active && (
            <div className="card-glass p-4">
              <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Session Details</h6>
              <div className="mb-3">
                <label className="form-label">What are you working on? *</label>
                <input className="form-input" placeholder="e.g. Feature development, Bug fixing…"
                  value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
              </div>
              <div className="mb-3">
                <label className="form-label">Category</label>
                <select className="form-input" value={form.category_id}
                  onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
                  <option value="">Select category…</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={2} placeholder="Any additional notes…"
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          )}
        </div>

        {/* Recent Sessions */}
        <div className="col-12 col-lg-5">
          <div className="card-glass p-4">
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Sessions</h6>
            {sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                <i className="bi bi-clock-history" style={{ fontSize: '2rem', display: 'block', marginBottom: 8, opacity: 0.4 }} />
                No completed sessions yet
              </div>
            ) : sessions.map(s => (
              <div key={s.id} style={{ padding: '12px', marginBottom: 8, borderRadius: 10, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div className="d-flex align-items-start justify-content-between">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{s.title || 'Work Session'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                      {formatDateTime(s.start_time)}
                      {s.category_name && <> · <span style={{ color: s.category_color }}>{s.category_name}</span></>}
                    </div>
                  </div>
                  <span style={{ fontFamily: 'JetBrains Mono', fontSize: '0.875rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                    {formatDurationHuman(s.total_duration)}
                  </span>
                </div>
                {s.productivity_score && (
                  <div style={{ marginTop: 6 }}>
                    <div className="d-flex gap-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div key={i} style={{ height: 4, flex: 1, borderRadius: 2, background: i < s.productivity_score ? 'var(--primary)' : 'var(--dark-border)' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2, display: 'block' }}>
                      Score: {s.productivity_score}/10
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {categories.length > 0 && (
            <div className="card-glass p-4 mt-4">
              <h6 style={{ fontWeight: 700, marginBottom: 12 }}>Categories</h6>
              <div className="d-flex flex-wrap gap-2">
                {categories.map(c => (
                  <span key={c.id} className="badge-custom" style={{ background: c.color + '22', color: c.color }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.color, display: 'inline-block' }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}