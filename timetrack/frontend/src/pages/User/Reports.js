import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { EmptyState, SkeletonCard } from '../../components/Shared/UIComponents';
import { reportAPI } from '../../services/api';
import { formatDurationHuman, formatDate } from '../../utils/helpers';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

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

export default function UserReports() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [params, setParams]   = useState({ type: 'weekly', from: '', to: '' });

  const load = async () => {
    setLoading(true);
    try {
      const res = await reportAPI.get(params);
      setData(res.data.data);
    } catch {
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const barData = {
    labels: (data?.by_day || []).map(d => formatDate(d.date)),
    datasets: [{
      label: 'Hours',
      data: (data?.by_day || []).map(d => +toHours(d.seconds)),
      backgroundColor: 'rgba(99,102,241,0.8)', borderRadius: 6,
    }]
  };

  const donutData = {
    labels: (data?.by_category || []).map(c => c.name || 'Uncategorized'),
    datasets: [{
      data: (data?.by_category || []).map(c => +toHours(c.seconds)),
      backgroundColor: (data?.by_category || []).map(c => c.color || '#6366f1'),
      borderWidth: 0,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 }, callback: v => v + 'h' } },
    }
  };

  const summaryCards = [
    { icon: 'bi-collection-fill',    label: 'Total Sessions',   value: Number(data?.summary?.total_sessions) || 0,          color: '#6366f1' },
    { icon: 'bi-clock-fill',         label: 'Total Hours',      value: toHours(data?.summary?.total_seconds) + 'h',          color: '#10b981' },
    { icon: 'bi-star-fill',          label: 'Avg Productivity', value: avgProductivity(data?.summary?.avg_productivity),     color: '#f59e0b' },
    { icon: 'bi-calendar-check-fill',label: 'Active Days',      value: data?.by_day?.length || 0,                            color: '#06b6d4' },
  ];

  return (
    <Layout title="My Reports">

      {/* Controls */}
      <div className="card-glass p-3 mb-4">
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label className="form-label">Report Type</label>
            <select className="form-input" value={params.type} onChange={e => setParams(p => ({ ...p, type: e.target.value }))}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom Range</option>
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
              <i className="bi bi-bar-chart-fill" /> Generate
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="row g-4"><div className="col-12"><SkeletonCard height={200} /></div></div>
      ) : !data ? null : (
        <>
          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            {summaryCards.map((s, i) => (
              <div key={i} className="col-6 col-lg-3">
                <div className="stat-card">
                  <div className="icon-wrap mb-3" style={{ background: s.color + '22' }}>
                    <i className={`bi ${s.icon}`} style={{ color: s.color }} />
                  </div>
                  <div className="value">{s.value}</div>
                  <div className="label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Charts */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-lg-8">
              <div className="card-glass p-4">
                <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Daily Hours</h6>
                <div style={{ height: 220 }}>
                  {data.by_day?.length
                    ? <Bar data={barData} options={chartOpts} />
                    : <EmptyState icon="📊" title="No data" />}
                </div>
              </div>
            </div>
            <div className="col-12 col-lg-4">
              <div className="card-glass p-4">
                <h6 style={{ fontWeight: 700, marginBottom: 20 }}>By Category</h6>
                <div style={{ height: 220 }}>
                  {data.by_category?.length ? (
                    <Doughnut data={donutData} options={{
                      responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', font: { size: 11 } } } }
                    }} />
                  ) : <EmptyState icon="🏷️" title="No data" />}
                </div>
              </div>
            </div>
          </div>

          {/* Session List */}
          {data.sessions?.length > 0 && (
            <div className="card-glass p-0" style={{ overflow: 'hidden' }}>
              <div className="p-4" style={{ borderBottom: '1px solid var(--dark-border)' }}>
                <h6 style={{ margin: 0, fontWeight: 700 }}>Session Details</h6>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="table-custom w-100">
                  <thead>
                    <tr><th>Title</th><th>Category</th><th>Date</th><th>Duration</th></tr>
                  </thead>
                  <tbody>
                    {data.sessions.slice(0, 20).map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 500 }}>{s.title || 'Work Session'}</td>
                        <td>
                          {s.category_name ? (
                            <span className="d-flex align-items-center gap-1">
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />
                              {s.category_name}
                            </span>
                          ) : '—'}
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(s.start_time)}</td>
                        <td style={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
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