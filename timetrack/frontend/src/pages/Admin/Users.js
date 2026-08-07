import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Shared/Layout';
import { SkeletonTable, EmptyState, ConfirmModal, Badge } from '../../components/Shared/UIComponents';
import { userAPI } from '../../services/api';
import { getInitials, formatDate } from '../../utils/helpers';
import { toast } from 'react-toastify';

const emptyForm = { name:'', email:'', password:'', department:'', position:'', role_id: 2 };

export default function AdminUsers() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [pagination, setPagination] = useState({ page:1, limit:15, total:0 });
  const [modal, setModal]       = useState(null); // null | 'create' | 'edit'
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [saving, setSaving]     = useState(false);

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try {
      const res = await userAPI.getAll({ page, limit:15, search });
      setUsers(res.data.data || []);
      setPagination(p => ({ ...p, page, total: res.data.pagination?.total || 0 }));
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(emptyForm); setEditId(null); setModal('create'); };
  const openEdit   = (u) => { setForm({ name:u.name, email:u.email, password:'', department:u.department||'', position:u.position||'', role_id: u.role==='admin'?1:2 }); setEditId(u.id); setModal('edit'); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === 'create') {
        await userAPI.create(form);
        toast.success('User created!');
      } else {
        const payload = { ...form }; delete payload.password;
        await userAPI.update(editId, payload);
        toast.success('User updated!');
      }
      setModal(null);
      load(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    await userAPI.toggleStatus(id);
    toast.success('Status updated');
    load(pagination.page);
  };

  const handleDelete = async () => {
    await userAPI.delete(deleteId).catch(() => toast.error('Delete failed'));
    toast.success('User deleted');
    setDeleteId(null);
    load(pagination.page);
  };

  const totalPages = Math.ceil(pagination.total / pagination.limit);

  return (
    <Layout title="User Management">
      {/* Header */}
      <div className="d-flex flex-wrap gap-3 align-items-center justify-content-between mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <div style={{ position:'relative' }}>
            <i className="bi bi-search" style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'var(--dark-muted)' }} />
            <input className="form-input" style={{ paddingLeft:36,width:240 }} placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key==='Enter' && load(1)} />
          </div>
          <button className="btn-ghost" onClick={() => load(1)}><i className="bi bi-search" /></button>
        </div>
        <button className="btn-primary-custom" onClick={openCreate}>
          <i className="bi bi-person-plus-fill" /> Add User
        </button>
      </div>

      {/* Table */}
      {loading ? <SkeletonTable rows={8} /> : users.length === 0 ? (
        <div className="card-glass"><EmptyState icon="👥" title="No users found" description="Create the first user" action={<button className="btn-primary-custom" onClick={openCreate}><i className="bi bi-plus" /> Add User</button>} /></div>
      ) : (
        <div className="card-glass p-0" style={{ overflow:'hidden' }}>
          <div style={{ overflowX:'auto' }}>
            <table className="table-custom w-100">
              <thead>
                <tr><th>User</th><th>Department</th><th>Role</th><th>Status</th><th>Joined</th><th>Last Login</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div className="avatar sm">{getInitials(u.name)}</div>
                        <div>
                          <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{u.name}</div>
                          <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize:'0.82rem' }}>{u.department || '—'}</td>
                    <td><Badge type={u.role==='admin'?'warning':'info'}>{u.role}</Badge></td>
                    <td><Badge type={u.is_active?'success':'danger'}>{u.is_active?'Active':'Inactive'}</Badge></td>
                    <td style={{ fontSize:'0.8rem' }}>{formatDate(u.created_at)}</td>
                    <td style={{ fontSize:'0.8rem' }}>{u.last_login ? formatDate(u.last_login) : 'Never'}</td>
                    <td>
                      <div className="d-flex gap-1">
                        <button className="btn-ghost" style={{ padding:'4px 8px',fontSize:'0.75rem' }} onClick={() => openEdit(u)} title="Edit">
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn-ghost" style={{ padding:'4px 8px',fontSize:'0.75rem', color: u.is_active?'var(--warning)':'var(--success)' }} onClick={() => handleToggle(u.id)} title={u.is_active?'Deactivate':'Activate'}>
                          <i className={`bi ${u.is_active?'bi-toggle-on':'bi-toggle-off'}`} />
                        </button>
                        <button className="btn-ghost" style={{ padding:'4px 8px',fontSize:'0.75rem',color:'var(--danger)' }} onClick={() => setDeleteId(u.id)} title="Delete">
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="d-flex align-items-center justify-content-between p-3" style={{ borderTop:'1px solid var(--dark-border)' }}>
              <span style={{ fontSize:'0.8rem',color:'var(--text-secondary)' }}>{pagination.total} users</span>
              <div className="d-flex gap-1">
                {Array.from({length:Math.min(totalPages,5)},(_,i)=>i+1).map(p=>(
                  <button key={p} onClick={()=>load(p)} className={p===pagination.page?'btn-primary-custom':'btn-ghost'} style={{padding:'4px 10px',minWidth:34,justifyContent:'center'}}>{p}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth:520 }}>
            <h5 style={{ marginBottom:20 }}>{modal==='create'?'Add New User':'Edit User'}</h5>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required />
              </div>
              <div className="col-12">
                <label className="form-label">Email *</label>
                <input type="email" className="form-input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required disabled={modal==='edit'} />
              </div>
              {modal==='create' && (
                <div className="col-12">
                  <label className="form-label">Password *</label>
                  <input type="password" className="form-input" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="Min 6 chars" required />
                </div>
              )}
              <div className="col-6">
                <label className="form-label">Department</label>
                <input className="form-input" value={form.department} onChange={e=>setForm(f=>({...f,department:e.target.value}))} placeholder="Engineering" />
              </div>
              <div className="col-6">
                <label className="form-label">Position</label>
                <input className="form-input" value={form.position} onChange={e=>setForm(f=>({...f,position:e.target.value}))} placeholder="Developer" />
              </div>
              <div className="col-12">
                <label className="form-label">Role</label>
                <select className="form-input" value={form.role_id} onChange={e=>setForm(f=>({...f,role_id:parseInt(e.target.value)}))}>
                  <option value={2}>User</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
            </div>
            <div className="d-flex gap-3 justify-content-end mt-4">
              <button className="btn-ghost" onClick={()=>setModal(null)}>Cancel</button>
              <button className="btn-primary-custom" onClick={handleSave} disabled={saving}>
                {saving?'Saving…':<><i className="bi bi-check2" /> {modal==='create'?'Create':'Save'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal open={!!deleteId} danger title="Delete User" message="This will permanently delete the user and all their data." onConfirm={handleDelete} onCancel={()=>setDeleteId(null)} />
    </Layout>
  );
}
