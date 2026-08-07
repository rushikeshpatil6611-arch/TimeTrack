import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { settingsAPI } from '../../services/api';
import { toast } from 'react-toastify';

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [form, setForm]         = useState({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    settingsAPI.get()
      .then(r => { const s=r.data.data||{}; setSettings(s); const f={}; Object.keys(s).forEach(k=>f[k]=s[k].value); setForm(f); })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await settingsAPI.update(form);
      toast.success('Settings saved!');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  const fields = [
    { key:'work_hours_per_day', label:'Work Hours Per Day', type:'number', min:1, max:24, desc:'Expected daily work hours' },
    { key:'overtime_threshold', label:'Overtime Threshold (hrs)', type:'number', min:1, max:24, desc:'Hours after which overtime alert fires' },
    { key:'break_reminder_interval', label:'Break Reminder Interval (min)', type:'number', min:15, max:300, desc:'Minutes between break reminders' },
    { key:'inactivity_timeout', label:'Inactivity Timeout (min)', type:'number', min:5, max:120, desc:'Minutes before inactivity alert' },
    { key:'company_name', label:'Company Name', type:'text', desc:'Displayed in reports and emails' },
    { key:'allow_registration', label:'Allow Public Registration', type:'select', options:[['1','Yes'],['0','No']], desc:'Allow new employees to self-register' },
  ];

  if (loading) return <Layout title="Settings"><div className="skeleton" style={{ height:400,borderRadius:14 }} /></Layout>;

  return (
    <Layout title="System Settings">
      <div className="row justify-content-center">
        <div className="col-12 col-lg-8">
          <form onSubmit={handleSave}>
            <div className="card-glass p-4 mb-4">
              <h6 style={{ fontWeight:700, marginBottom:20 }}>⚙️ Work Hour Rules</h6>
              <div className="row g-3">
                {fields.slice(0,4).map(f => (
                  <div key={f.key} className="col-12 col-md-6">
                    <label className="form-label">{f.label}</label>
                    <input type={f.type} className="form-input" min={f.min} max={f.max}
                      value={form[f.key]||''} onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))} />
                    <div style={{ fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-glass p-4 mb-4">
              <h6 style={{ fontWeight:700, marginBottom:20 }}>🏢 Organisation</h6>
              <div className="row g-3">
                {fields.slice(4).map(f => (
                  <div key={f.key} className="col-12 col-md-6">
                    <label className="form-label">{f.label}</label>
                    {f.type==='select' ? (
                      <select className="form-input" value={form[f.key]||''} onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))}>
                        {(f.options||[]).map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    ) : (
                      <input type={f.type} className="form-input" value={form[f.key]||''} onChange={e=>setForm(prev=>({...prev,[f.key]:e.target.value}))} />
                    )}
                    <div style={{ fontSize:'0.72rem',color:'var(--text-secondary)',marginTop:4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="btn-primary-custom" disabled={saving}>
              {saving ? <><span className="spinner-border spinner-border-sm me-2"/>Saving…</> : <><i className="bi bi-check2"/> Save Settings</>}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
