import React, { useState, useEffect, useRef, useCallback } from 'react';
import Layout from '../../components/Shared/Layout';
import { StatCard, SkeletonCard, EmptyState } from '../../components/Shared/UIComponents';
import { sessionAPI, categoryAPI } from '../../services/api';
import { formatDuration, formatDurationHuman } from '../../utils/helpers';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

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

export default function UserDashboard() {
  const [stats, setStats]             = useState(null);
  const [activeSession, setActive]    = useState(null);
  const [categories, setCategories]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [startModal, setStartModal]   = useState(false);
  const [sessionForm, setSessionForm] = useState({ category_id: '', title: '', notes: '' });
  const intervalRef = useRef(null);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!activeSession) { setLiveSeconds(0); return; }

    const compute = () => getElapsedSeconds(activeSession.start_time, activeSession.pause_duration);

    if (activeSession.status === 'active') {
      setLiveSeconds(compute()); // immediate
      intervalRef.current = setInterval(() => setLiveSeconds(compute()), 1000);
    } else if (activeSession.status === 'paused') {
      setLiveSeconds(compute()); // frozen
    } else {
      setLiveSeconds(0);
    }

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activeSession]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, activeRes, catRes] = await Promise.all([
        sessionAPI.getStats(),
        sessionAPI.getActive(),
        categoryAPI.getAll(),
      ]);
      setStats(statsRes.data.data);
      setActive(activeRes.data.data);
      setCategories(catRes.data.data || []);
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleStart = async () => {
    try {
      await sessionAPI.start(sessionForm);
      toast.success('Session started!');
      setStartModal(false);
      setSessionForm({ category_id: '', title: '', notes: '' });
      await loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handleStop = async () => {
    if (!activeSession) return;
    try {
      await sessionAPI.stop(activeSession.id);
      toast.success('Session saved!');
      await loadData();
    } catch {
      toast.error('Failed to stop session');
    }
  };

  const handlePause = async () => {
    if (!activeSession) return;
    try {
      if (activeSession.status === 'active') {
        await sessionAPI.pause(activeSession.id);
        toast.info('Session paused');
      } else {
        await sessionAPI.resume(activeSession.id);
        toast.success('Session resumed');
      }
      await loadData();
    } catch {
      toast.error('Action failed');
    }
  };

  const lineData = {
    labels: (stats?.daily_trend || []).map(d =>
      new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    ),
    datasets: [{
      label: 'Hours Worked',
      data: (stats?.daily_trend || []).map(d => +(d.seconds / 3600).toFixed(1)),
      fill: true, borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4, pointRadius: 4, pointBackgroundColor: '#6366f1',
    }]
  };

  const donutData = {
    labels: (stats?.by_category || []).map(c => c.name || 'Uncategorized'),
    datasets: [{
      data: (stats?.by_category || []).map(c => +(c.seconds / 3600).toFixed(1)),
      backgroundColor: (stats?.by_category || []).map(c => c.color || '#6366f1'),
      borderWidth: 0, hoverOffset: 8,
    }]
  };

  const chartOptions = {
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${ctx.formattedValue}h` } }
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
    }
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="row g-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="col-12 col-sm-6 col-xl-3"><SkeletonCard /></div>
        ))}
      </div>
    </Layout>
  );

  return (
    <Layout title="Dashboard">

      {/* Timer Card */}
      <div className="timer-card mb-4">
        <div className="d-flex flex-column flex-md-row align-items-center gap-4">
          <div className="flex-grow-1 text-center text-md-start">

            <div className="d-flex align-items-center gap-2 justify-content-center justify-content-md-start mb-2">
              <span className={`timer-status-badge ${activeSession ? activeSession.status : 'idle'}`}>
                <span className="dot" />
                {activeSession
                  ? (activeSession.status === 'active' ? 'Running' : 'Paused')
                  : 'Not tracking'}
              </span>
              {activeSession?.category_name && (
                <span className="badge-custom badge-primary">{activeSession.category_name}</span>
              )}
            </div>

            <div className="timer-display">{formatDuration(liveSeconds)}</div>

            {activeSession && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                Started {formatStartTime(activeSession.start_time)} · {activeSession.title}
              </div>
            )}
          </div>

          <div className="d-flex gap-2 flex-wrap justify-content-center">
            {!activeSession ? (
              <button className="btn-success-custom" onClick={() => setStartModal(true)}>
                <i className="bi bi-play-fill" /> Start Tracking
              </button>
            ) : (
              <>
                <button className="btn-ghost" onClick={handlePause}>
                  <i className={`bi ${activeSession.status === 'active' ? 'bi-pause-fill' : 'bi-play-fill'}`} />
                  {activeSession.status === 'active' ? 'Pause' : 'Resume'}
                </button>
                <button className="btn-danger-custom" onClick={handleStop}>
                  <i className="bi bi-stop-fill" /> Stop
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-clock-fill" label="Today" value={formatDurationHuman(stats?.today_seconds)} color="primary" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-calendar-week-fill" label="This Week" value={formatDurationHuman(stats?.week_seconds)} color="info" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-calendar-month-fill" label="This Month" value={formatDurationHuman(stats?.month_seconds)} color="success" />
        </div>
        <div className="col-6 col-xl-3">
          <StatCard icon="bi-collection-fill" label="Total Sessions" value={stats?.total_sessions || 0} color="warning" />
        </div>
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card-glass p-4 h-100">
            <h6 style={{ fontWeight: 700, marginBottom: 20 }}>30-Day Activity Trend</h6>
            <div className="chart-container" style={{ height: 220 }}>
              {(stats?.daily_trend?.length || 0) > 0
                ? <Line data={lineData} options={chartOptions} />
                : <EmptyState icon="📈" title="No data yet" description="Start tracking to see your trend" />
              }
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card-glass p-4 h-100">
            <h6 style={{ fontWeight: 700, marginBottom: 20 }}>By Category</h6>
            <div className="chart-container" style={{ height: 180 }}>
              {(stats?.by_category?.length || 0) > 0
                ? <Doughnut data={donutData} options={{
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 }, padding: 12 } } }
                  }} />
                : <EmptyState icon="🏷️" title="No sessions" description="Track work by category" />
              }
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      {(stats?.by_category?.length || 0) > 0 && (
        <div className="card-glass p-4">
          <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Category Breakdown</h6>
          <div className="row g-2">
            {stats.by_category.map(cat => (
              <div key={cat.name} className="col-12 col-md-6">
                <div className="d-flex align-items-center gap-3 mb-1">
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', flex: 1 }}>{cat.name || 'Uncategorized'}</span>
                  <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{formatDurationHuman(cat.seconds)}</span>
                </div>
                <div className="progress-bar-custom">
                  <div className="progress-bar-fill" style={{
                    width: `${Math.min(100, (cat.seconds / (stats.month_seconds || 1)) * 100)}%`,
                    background: cat.color
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Start Session Modal */}
      {startModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5 style={{ marginBottom: 20 }}>Start New Session</h5>
            <div className="mb-3">
              <label className="form-label">Session Title</label>
              <input className="form-input" placeholder="What are you working on?"
                value={sessionForm.title}
                onChange={e => setSessionForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="mb-3">
              <label className="form-label">Category</label>
              <select className="form-input" value={sessionForm.category_id}
                onChange={e => setSessionForm(f => ({ ...f, category_id: e.target.value }))}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="mb-4">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-input" rows={3} placeholder="Add notes..."
                value={sessionForm.notes}
                onChange={e => setSessionForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
            <div className="d-flex gap-3 justify-content-end">
              <button className="btn-ghost" onClick={() => setStartModal(false)}>Cancel</button>
              <button className="btn-success-custom" onClick={handleStart}>
                <i className="bi bi-play-fill" /> Start
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}