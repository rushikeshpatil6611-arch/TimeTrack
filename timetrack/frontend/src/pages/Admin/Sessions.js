import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Shared/Layout';
import { SkeletonTable, EmptyState, Badge } from '../../components/Shared/UIComponents';
import { sessionAPI, adminAPI, userAPI } from '../../services/api';
import { formatDurationHuman, formatDateTime, getInitials } from '../../utils/helpers';
import { toast } from 'react-toastify';

export default function AdminSessions() {
  const [sessions, setSessions]   = useState([]);
  const [live, setLive]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('all');
  const [pagination, setPagination] = useState({ page:1, limit:15, total:0 });
  const [tick, setTick]           = useState(0);

  useEffect(() => {
    loadAll();
    const iv = setInterval(() => { setTick(t=>t+1); adminAPI.getLiveSessions().then(r=>setLive(r.data.data||[])).catch(()=>{}); }, 10000);
    return () => clearInterval(iv);
  }, []);

  const loadAll = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const [allRes, liveRes] = await Promise.all([
        sessionAPI.getAll({ page, limit:15 }),
        adminAPI.getLiveSessions(),
      ]);
      setSessions(allRes.data.data || []);
      setLive(liveRes.data.data || []);
      setPagination(p => ({ ...p, page, total: allRes.data.pagination?.total || 0 }));
    } catch { toast.error('Failed to load sessions'); }
    finally { setLoading(false); }
  }, []);

  const getLiveDuration = (s) => {
    const elapsed = Math.floor((Date.now() - new Date(s.start_time)) / 1000);
    return Math.max(0, elapsed - (s.pause_duration || 0));
  };

  const statusColor = { active:'success', paused:'warning', completed:'primary', cancelled:'danger' };
  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Layout title="Sessions Monitor">
      {/* Live Sessions Banner */}
      {live.length > 0 && (
        <div style={{ background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:20 }}>
          <div className="d-flex align-items-center gap-2 mb-2">
            <span style={{ width:8,height:8,borderRadius:'50%',background:'var(--success)',animation:'pulse 1.5s infinite',display:'inline-block' }} />
            <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--success)' }}>{live.length} Active Session{live.length!==1?'s':''}</span>
          </div>
          <div className="d-flex flex-wrap gap-2">
            {live.map(s => (
              <div key={s.id} style={{ background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',borderRadius:8,padding:'6px 12px',fontSize:'0.78rem' }}>
                <span className="d-flex align-items-center gap-1">
                  <div className="avatar sm" style={{width:20,height:20,fontSize:'0.6rem'}}>{getInitials(s.user_name)}</div>
                  <strong>{s.user_name}</strong>
                  {s.status==='paused' && <span className="badge-custom badge-warning" style={{fontSize:'0.65rem'}}>paused</span>}
                  <span style={{color:'var(--text-secondary)'}}>· {formatDurationHuman(getLiveDuration(s))}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="d-flex gap-2 mb-4">
        {['all','live'].map(t => (
          <button key={t} onClick={()=>setTab(t)} className={tab===t?'btn-primary-custom':'btn-ghost'} style={{padding:'8px 16px',textTransform:'capitalize'}}>
            {t==='live' ? `Live (${live.length})` : 'All Sessions'}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} /> : (
        <div className="card-glass p-0" style={{ overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table className="table-custom w-100">
              <thead>
                <tr><th>Employee</th><th>Title</th><th>Category</th><th>Started</th><th>Duration</th><th>Status</th></tr>
              </thead>
              <tbody>
                {(tab==='live' ? live : sessions).map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar sm">{getInitials(s.user_name||'U')}</div>
                        <div>
                          <div style={{fontWeight:600,fontSize:'0.82rem'}}>{s.user_name}</div>
                          {s.department && <div style={{fontSize:'0.72rem',color:'var(--text-secondary)'}}>{s.department}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:'0.82rem',maxWidth:180}}>{s.title||'Work Session'}</td>
                    <td>
                      {s.category_name ? (
                        <span className="d-flex align-items-center gap-1" style={{fontSize:'0.82rem'}}>
                          <span style={{width:7,height:7,borderRadius:'50%',background:s.category_color,display:'inline-block'}}/>
                          {s.category_name}
                        </span>
                      ) : <span style={{color:'var(--dark-muted)'}}>—</span>}
                    </td>
                    <td style={{fontSize:'0.8rem',whiteSpace:'nowrap'}}>{formatDateTime(s.start_time)}</td>
                    <td style={{fontFamily:'JetBrains Mono',fontWeight:600,fontSize:'0.82rem'}}>
                      {tab==='live' ? formatDurationHuman(getLiveDuration(s)) : (s.total_duration ? formatDurationHuman(s.total_duration) : '—')}
                    </td>
                    <td><Badge type={statusColor[s.status]||'muted'}>{s.status}</Badge></td>
                  </tr>
                ))}
                {(tab==='live'?live:sessions).length===0 && (
                  <tr><td colSpan={6}><EmptyState icon="⏰" title="No sessions" /></td></tr>
                )}
              </tbody>
            </table>
          </div>
          {tab==='all' && totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between p-3" style={{borderTop:'1px solid var(--dark-border)'}}>
              <span style={{fontSize:'0.8rem',color:'var(--text-secondary)'}}>{pagination.total} total</span>
              <div className="d-flex gap-1">
                {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>loadAll(p)} className={p===pagination.page?'btn-primary-custom':'btn-ghost'} style={{padding:'4px 10px',minWidth:34,justifyContent:'center'}}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
