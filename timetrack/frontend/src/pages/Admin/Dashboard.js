import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { StatCard, SkeletonCard, Avatar } from '../../components/Shared/UIComponents';
import { adminAPI } from '../../services/api';
import { formatDurationHuman, formatDateTime, getInitials } from '../../utils/helpers';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler } from 'chart.js';
import { toast } from 'react-toastify';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getDashboard()
      .then(r => setData(r.data.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));

    const refresh = setInterval(() => {
      adminAPI.getDashboard().then(r => setData(r.data.data)).catch(() => {});
    }, 30000);
    return () => clearInterval(refresh);
  }, []);

  if (loading) return (
    <Layout title="Admin Dashboard">
      <div className="row g-4">{[1,2,3,4].map(i => <div key={i} className="col-6 col-xl-3"><SkeletonCard /></div>)}</div>
    </Layout>
  );

  const lineData = {
    labels: (data?.daily_trend || []).map(d => new Date(d.date).toLocaleDateString('en',{month:'short',day:'numeric'})),
    datasets: [{
      label: 'Sessions',
      data: (data?.daily_trend || []).map(d => d.sessions),
      fill: true, borderColor: '#6366f1',
      backgroundColor: 'rgba(99,102,241,0.1)',
      tension: 0.4, pointRadius: 3,
    },{
      label: 'Hours',
      data: (data?.daily_trend || []).map(d => +(d.seconds/3600).toFixed(1)),
      fill: false, borderColor: '#10b981', tension: 0.4, pointRadius: 3,
      yAxisID: 'y1',
    }]
  };

  const donutData = {
    labels: (data?.category_usage || []).map(c => c.name),
    datasets: [{
      data: (data?.category_usage || []).map(c => c.sessions),
      backgroundColor: (data?.category_usage || []).map(c => c.color || '#6366f1'),
      borderWidth: 0, hoverOffset: 6,
    }]
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { labels: { color: '#94a3b8', font: { size: 11 } } } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#94a3b8', font: { size: 11 } }, position: 'left' },
      y1: { grid: { display: false }, ticks: { color: '#10b981', font: { size: 11 } }, position: 'right' },
    }
  };

  return (
    <Layout title="Admin Dashboard">
      {/* Stats */}
      <div className="row g-3 mb-4">
        {[
          { icon: 'bi-people-fill',       label: 'Total Users',       value: data?.stats?.total_users || 0,      color: 'primary' },
          { icon: 'bi-person-check-fill', label: 'Active Users',      value: data?.stats?.active_users || 0,     color: 'success' },
          { icon: 'bi-play-circle-fill',  label: 'Live Sessions',     value: data?.stats?.active_sessions || 0,  color: 'warning' },
          { icon: 'bi-clock-history',     label: "Today's Hours",     value: formatDurationHuman(data?.stats?.today_seconds), color: 'info' },
        ].map((s,i) => (
          <div key={i} className="col-6 col-xl-3">
            <StatCard icon={s.icon} label={s.label} value={s.value} color={s.color} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-lg-8">
          <div className="card-glass p-4 h-100">
            <h6 style={{ fontWeight: 700, marginBottom: 20 }}>14-Day Activity Overview</h6>
            <div style={{ height: 240 }}>
              <Line data={lineData} options={chartOpts} />
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="card-glass p-4 h-100">
            <h6 style={{ fontWeight: 700, marginBottom: 20 }}>Category Usage</h6>
            <div style={{ height: 240 }}>
              {(data?.category_usage?.length || 0) > 0 ? (
                <Doughnut data={donutData} options={{ responsive:true, maintainAspectRatio:false, plugins:{ legend:{ position:'bottom', labels:{ color:'#94a3b8',font:{size:10},padding:10 } } } }} />
              ) : <div style={{ textAlign:'center', paddingTop:60, color:'var(--text-secondary)' }}>No data yet</div>}
            </div>
          </div>
        </div>
      </div>

      <div className="row g-4">
        {/* Top Performers */}
        <div className="col-12 col-lg-7">
          <div className="card-glass p-4">
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>🏆 Top Performers This Week</h6>
            {(data?.top_performers || []).length === 0 ? (
              <div style={{ textAlign:'center',padding:'24px',color:'var(--text-secondary)',fontSize:'0.875rem' }}>No data yet</div>
            ) : (data?.top_performers || []).map((p, i) => (
              <div key={p.id} className="d-flex align-items-center gap-3 mb-3">
                <div style={{ width: 24, fontWeight: 800, color: i < 3 ? ['#f59e0b','#94a3b8','#cd7c2f'][i] : 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  #{i + 1}
                </div>
                <div className="avatar sm">{getInitials(p.name)}</div>
                <div className="flex-grow-1">
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{p.department || 'No dept'} · {p.sessions} sessions</div>
                </div>
                <div style={{ fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--primary)', fontSize: '0.875rem' }}>
                  {formatDurationHuman(p.seconds)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-12 col-lg-5">
          <div className="card-glass p-4">
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Activity</h6>
            {(data?.recent_activity || []).length === 0 ? (
              <div style={{ textAlign:'center',padding:'24px',color:'var(--text-secondary)',fontSize:'0.875rem' }}>No activity yet</div>
            ) : (data?.recent_activity || []).map(a => (
              <div key={a.id} className="d-flex align-items-start gap-3 mb-3">
                <div style={{ width: 8, height: 8, borderRadius:'50%', background:'var(--primary)', marginTop:6, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'0.82rem', fontWeight:600 }}>{a.user_name || 'System'}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>
                    {a.action.replace(/_/g,' ')} · {formatDateTime(a.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
