import React, { useState, useEffect } from 'react';
import Layout from '../../components/Shared/Layout';
import { EmptyState, ConfirmModal, Badge } from '../../components/Shared/UIComponents';
import { categoryAPI } from '../../services/api';
import { toast } from 'react-toastify';

const ICONS = ['briefcase','code','users','file-text','check-circle','search','pen-tool','book','settings','star','lightning','cpu','globe','bar-chart','camera'];
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#64748b','#f97316','#84cc16'];
const emptyForm = { name:'', color:'#6366f1', icon:'briefcase', description:'' };

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [editId, setEditId]         = useState(null);
  const [deleteId, setDeleteId]     = useState(null);
  const [saving, setSaving]         = useState(false);

  const load = async () => {
    setLoading(true);
    try { const res = await categoryAPI.getAll(); setCategories(res.data.data || []); }
    catch { toast.error('Failed to load categories'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal(true); };
  const openEdit   = (c) => { setForm({ name:c.name, color:c.color, icon:c.icon||'briefcase', description:c.description||'' }); setEditId(c.id); setModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.warning('Name is required'); return; }
    setSaving(true);
    try {
      if (editId) { await categoryAPI.update(editId, form); toast.success('Category updated!'); }
      else { await categoryAPI.create(form); toast.success('Category created!'); }
      setModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    await categoryAPI.delete(deleteId).catch(() => toast.error('Delete failed'));
    toast.success('Category deleted');
    setDeleteId(null);
    load();
  };

  return (
    <Layout title="Work Categories">
      <div className="d-flex justify-content-end mb-4">
        <button className="btn-primary-custom" onClick={openCreate}>
          <i className="bi bi-plus-circle-fill" /> Add Category
        </button>
      </div>

      {loading ? (
        <div className="row g-3">{[1,2,3,4,5,6].map(i=><div key={i} className="col-6 col-md-4 col-lg-3"><div className="skeleton" style={{height:100,borderRadius:14}} /></div>)}</div>
      ) : categories.length === 0 ? (
        <div className="card-glass"><EmptyState icon="🏷️" title="No categories" action={<button className="btn-primary-custom" onClick={openCreate}>Add Category</button>} /></div>
      ) : (
        <div className="row g-3">
          {categories.map(c => (
            <div key={c.id} className="col-6 col-md-4 col-lg-3">
              <div className="card-glass p-3" style={{ cursor:'pointer', transition:'var(--transition)' }}>
                <div className="d-flex align-items-start justify-content-between mb-2">
                  <div style={{ width:44,height:44,borderRadius:12,background:c.color+'22',display:'flex',alignItems:'center',justifyContent:'center' }}>
                    <i className={`bi bi-${c.icon||'briefcase'}`} style={{ color:c.color, fontSize:'1.2rem' }} />
                  </div>
                  <div className="d-flex gap-1">
                    <button className="btn-ghost" style={{padding:'3px 7px',fontSize:'0.72rem'}} onClick={()=>openEdit(c)}>
                      <i className="bi bi-pencil" />
                    </button>
                    <button className="btn-ghost" style={{padding:'3px 7px',fontSize:'0.72rem',color:'var(--danger)'}} onClick={()=>setDeleteId(c.id)}>
                      <i className="bi bi-trash" />
                    </button>
                  </div>
                </div>
                <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{c.name}</div>
                {c.description && <div style={{ fontSize:'0.75rem',color:'var(--text-secondary)',marginTop:4 }}>{c.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h5 style={{ marginBottom:20 }}>{editId ? 'Edit Category' : 'New Category'}</h5>
            <div className="mb-3">
              <label className="form-label">Name *</label>
              <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Coding, Design…" />
            </div>
            <div className="mb-3">
              <label className="form-label">Description</label>
              <input className="form-input" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description" />
            </div>
            <div className="mb-3">
              <label className="form-label">Color</label>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {COLORS.map(col => (
                  <button key={col} onClick={()=>setForm(f=>({...f,color:col}))} style={{
                    width:28,height:28,borderRadius:'50%',background:col,border:form.color===col?'3px solid #fff':'2px solid transparent',cursor:'pointer',padding:0
                  }} />
                ))}
                <input type="color" value={form.color} onChange={e=>setForm(f=>({...f,color:e.target.value}))} style={{ width:28,height:28,borderRadius:'50%',border:'none',cursor:'pointer',background:'none' }} title="Custom color" />
              </div>
            </div>
            <div className="mb-4">
              <label className="form-label">Icon</label>
              <div className="d-flex flex-wrap gap-2 mt-1">
                {ICONS.map(icon => (
                  <button key={icon} onClick={()=>setForm(f=>({...f,icon}))} style={{
                    width:36,height:36,borderRadius:8,background:form.icon===icon?'rgba(99,102,241,0.2)':'var(--glass-bg)',
                    border:form.icon===icon?'1px solid var(--primary)':'1px solid var(--dark-border)',cursor:'pointer',color:form.icon===icon?'var(--primary)':'var(--text-secondary)'
                  }}>
                    <i className={`bi bi-${icon}`} />
                  </button>
                ))}
              </div>
            </div>
            {/* Preview */}
            <div className="mb-4 p-3" style={{ background:'var(--glass-bg)',borderRadius:10,display:'flex',alignItems:'center',gap:12 }}>
              <div style={{ width:40,height:40,borderRadius:10,background:form.color+'22',display:'flex',alignItems:'center',justifyContent:'center' }}>
                <i className={`bi bi-${form.icon}`} style={{ color:form.color,fontSize:'1.1rem' }} />
              </div>
              <span style={{ fontWeight:700 }}>{form.name || 'Preview'}</span>
            </div>
            <div className="d-flex gap-3 justify-content-end">
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving…' : <><i className="bi bi-check2" /> Save</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteId} danger title="Delete Category" message="This category will be removed. Existing sessions keep their data." onConfirm={handleDelete} onCancel={()=>setDeleteId(null)} />
    </Layout>
  );
}
