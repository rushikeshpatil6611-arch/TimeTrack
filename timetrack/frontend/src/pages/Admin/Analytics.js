import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { SkeletonCard } from '../../components/Shared/UIComponents';
import { adminAPI } from '../../services/api';
import { Line, Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

// Safely convert any value to seconds — guards against milliseconds & strings
const safeSec = (val) => {
  const n = Number(val) || 0;
  // If value is suspiciously large (looks like milliseconds), convert to seconds
  return n > 86400 * 365 * 10 ? Math.floor(n / 1000) : n;
};

// Convert seconds to hours string e.g. "3.5"
const toHours = (val) => {
  const s = safeSec(val);
  return (s / 3600).toFixed(1);
};

// Human readable e.g. "3h 30m"
const toHuman = (val) => {
  const s = safeSec(val);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export default function AdminAnalytics() {
  const [data, setData]       = useState(null);
  const [period, setPeriod]   = useState('30');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getAnalytics({ period });
      setData(res.data.data);
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Summary Calculations (all guarded) ───────────────────
  const totalSessions = (data?.session_trend || []).reduce((a, d) => a + (Number(d.sessions) || 0), 0);
  const totalSeconds  = (data?.session_trend || []).reduce((a, d) => a + safeSec(d.seconds), 0);
  const avgPerDay     = (totalSessions / (parseInt(period) || 1)).toFixed(1);

  // ── Chart Data ────────────────────────────────────────────
  const sessionLineData = {
    labels: (data?.session_trend || []).map(d =>
      new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label: 'Sessions',
        data: (data?.session_trend || []).map(d => Number(d.sessions) || 0),
        fill: true, borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        tension: 0.4, pointRadius: 3,
      },
      {
        label: 'Hours',
        data: (data?.session_trend || []).map(d => +toHours(d.seconds)),
        fill: false, borderColor: '#10b981',
        tension: 0.4, pointRadius: 3, yAxisID: 'y1',
      }
    ]
  };

  const deptBarData = {
    labels: (data?.dept_stats || []).map(d => d.department),
    datasets: [
      {
        label: 'Total Hours',
        data: (data?.dept_stats || []).map(d => +toHours(d.seconds)),
        backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6,
      },
      {
        label: 'Sessions',
        data: (data?.dept_stats || []).map(d => Number(d.sessions) || 0),
        backgroundColor: 'rgba(16,185,129,0.8)', borderRadius: 6,
      }
    ]
  };

  const opts = (dual = false) => ({
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      ...(dual && {
        y1: { position: 'right', grid: { display: false }, ticks: { color: '#10b981', font: { size: 11 } } }
      })
    }
  });

  const summaryCards = [
    { label: 'Total Sessions',     value: totalSessions,              icon: 'bi-collection-fill', color: '#6366f1' },
    { label: 'Total Hours',        value: toHours(totalSeconds) + 'h', icon: 'bi-clock-fill',      color: '#10b981' },
    { label: 'Active Departments', value: (data?.dept_stats||[]).length, icon: 'bi-building',      color: '#f59e0b' },
    { label: 'Avg Sessions/Day',   value: avgPerDay,                  icon: 'bi-graph-up',        color: '#06b6d4' },
  ];

  return (
    <Layout title="Analytics">

      {/* Period Selector */}
      <div className="d-flex gap-2 mb-4">
        {[['7','7 Days'],['14','14 Days'],['30','30 Days'],['90','90 Days']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setPeriod(val)}
            className={period === val ? 'btn-primary-custom' : 'btn-ghost'}
            style={{ padding: '8px 16px' }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="row g-4">
          {[1, 2].map(i => <div key={i} className="col-12"><SkeletonCard height={250} /></div>)}
        </div>
      ) : !data ? null : (
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

          {/* Session & Hours Trend Chart */}
          <div className="card-glass p-4 mb-4">
            <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Session & Hours Trend</h6>
            <div style={{ height: 260 }}>
              <Line data={sessionLineData} options={opts(true)} />
            </div>
          </div>

          {/* Department Breakdown Chart */}
          {(data.dept_stats || []).length > 0 && (
            <div className="card-glass p-4 mb-4">
              <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Department Breakdown</h6>
              <div style={{ height: 260 }}>
                <Bar data={deptBarData} options={opts()} />
              </div>
            </div>
          )}

          {/* Department Details Table */}
          {(data.dept_stats || []).length > 0 && (
            <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
              <div className="p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700 }}>Department Details</h6>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table-custom w-100">
                  <thead>
                    <tr>
                      <th>Department</th>
                      <th>Users</th>
                      <th>Sessions</th>
                      <th>Total Hours</th>
                      <th>Avg / User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.dept_stats.map(d => {
                      const sec    = safeSec(d.seconds);
                      const users  = Number(d.users) || 0;
                      const avgSec = users ? sec / users : 0;
                      return (
                        <tr key={d.department}>
                          <td style={{ fontWeight: 600 }}>{d.department}</td>
                          <td>{users}</td>
                          <td>{Number(d.sessions) || 0}</td>
                          <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                            {toHours(sec)}h
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginLeft: 6 }}>
                              ({toHuman(sec)})
                            </span>
                          </td>
                          <td style={{ fontFamily: 'JetBrains Mono' }}>
                            {users ? toHours(avgSec) + 'h' : '—'}
                          </td>
                        </tr>
                      );
                    })}
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