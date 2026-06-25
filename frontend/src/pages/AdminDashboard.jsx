import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import './AdminDashboard.css';

const TABS = ['Users', 'Activity Logs'];

function Toast({ toasts }) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`} role="status">{t.msg}</div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab,    setActiveTab]    = useState('Users');
  const [stats,        setStats]        = useState(null);
  const [users,        setUsers]        = useState([]);
  const [logs,         setLogs]         = useState([]);
  const [logMeta,      setLogMeta]      = useState({ total: 0, page: 1, pages: 1 });
  const [editingId,    setEditingId]    = useState(null);
  const [editForm,     setEditForm]     = useState({});
  const [saving,       setSaving]       = useState(false);
  const [toasts,       setToasts]       = useState([]);

  const addToast = (msg, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  };

  const fetchStats = useCallback(async () => {
    try { const r = await api.get('/admin/stats'); setStats(r.data); } catch (_) {}
  }, []);

  const fetchUsers = useCallback(async () => {
    try { const r = await api.get('/admin/users'); setUsers(r.data); } catch (_) {}
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      const r = await api.get(`/logs/?page=${page}&limit=15`);
      setLogs(r.data.logs);
      setLogMeta({ total: r.data.total, page: r.data.page, pages: r.data.pages });
    } catch (_) {}
  }, []);

  useEffect(() => { fetchStats(); fetchUsers(); }, [fetchStats, fetchUsers]);
  useEffect(() => { if (activeTab === 'Activity Logs') fetchLogs(); }, [activeTab, fetchLogs]);

  const handleToggle = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle`);
      fetchUsers(); fetchStats();
      addToast('User status updated');
    } catch (err) { addToast(err.response?.data?.detail || 'Failed to update', 'error'); }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Delete "${name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchUsers(); fetchStats();
      addToast('User deleted');
    } catch (err) { addToast(err.response?.data?.detail || 'Delete failed', 'error'); }
  };

  const openEdit = (u) => {
    setEditingId(u.id);
    setEditForm({ name: u.name, email: u.email, role: u.role });
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/users/${editingId}`, editForm);
      setEditingId(null);
      fetchUsers();
      addToast('User updated successfully');
    } catch (err) { addToast(err.response?.data?.detail || 'Update failed', 'error'); }
    finally { setSaving(false); }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <div className="admin-page">
      <Toast toasts={toasts} />

      <div className="admin-header">
        <h1>Admin Panel</h1>
        <p>Manage user accounts and monitor system activity</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Users</span>
            <span className="stat-value">{stats.total_users}</span>
            <span className="stat-sub">{stats.active_users} active</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active Users</span>
            <span className="stat-value">{stats.active_users}</span>
            <span className="stat-sub">{stats.total_users - stats.active_users} disabled</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Total Chats</span>
            <span className="stat-value">{stats.total_chats}</span>
            <span className="stat-sub">all time</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Activity Logs</span>
            <span className="stat-value">{stats.total_logs}</span>
            <span className="stat-sub">events tracked</span>
          </div>
        </div>
      )}

      <div className="tab-bar" role="tablist">
        {TABS.map(t => (
          <button key={t} role="tab" aria-selected={activeTab === t}
            className={`tab-btn ${activeTab === t ? 'active' : ''}`}
            onClick={() => setActiveTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'Users' && (
        <div className="table-container">
          <div className="table-toolbar">
            <span className="table-title">All Users</span>
            <span className="table-count">{users.length} total</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    {editingId === u.id ? (
                      <>
                        <td><input value={editForm.name}  onChange={e => setEditForm({...editForm, name:  e.target.value})} className="inline-input" /></td>
                        <td><input value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="inline-input" /></td>
                        <td>
                          <select value={editForm.role} onChange={e => setEditForm({...editForm, role: e.target.value})} className="inline-select">
                            <option value="user">user</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td>—</td>
                        <td>—</td>
                        <td>
                          <div className="action-cell">
                            <button className="icon-btn save" onClick={saveEdit} disabled={saving}>{saving ? '…' : 'Save'}</button>
                            <button className="icon-btn cancel" onClick={() => setEditingId(null)}>Cancel</button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{u.name}</td>
                        <td className="cell-muted">{u.email}</td>
                        <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                        <td>
                          <span className={`badge ${u.is_active ? 'active' : 'inactive'}`}>
                            <span className="badge-dot" style={{background: u.is_active ? 'var(--green)' : 'var(--red)'}} />
                            {u.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="cell-dimmer">{fmtDate(u.created_at)}</td>
                        <td>
                          <div className="action-cell">
                            <button className="icon-btn edit"    onClick={() => openEdit(u)}>Edit</button>
                            <button className={`icon-btn ${u.is_active ? 'disable' : 'enable'}`} onClick={() => handleToggle(u.id)}>
                              {u.is_active ? 'Disable' : 'Enable'}
                            </button>
                            <button className="icon-btn delete" onClick={() => handleDelete(u.id, u.name)}>Delete</button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="empty-state"><span>👤</span><p>No users found</p></div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'Activity Logs' && (
        <div className="table-container">
          <div className="table-toolbar">
            <span className="table-title">Activity Logs</span>
            <span className="table-count">{logMeta.total} events</span>
          </div>
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>User</th>
                  <th>Details</th>
                  <th>IP Address</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td><span className="badge log-action">{log.action}</span></td>
                    <td className="cell-muted">{log.user_email || '—'}</td>
                    <td className="cell-muted">{log.details || '—'}</td>
                    <td className="cell-dimmer">{log.ip_address || '—'}</td>
                    <td className="cell-dimmer">{fmtDate(log.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {logs.length === 0 && (
              <div className="empty-state"><span>📋</span><p>No activity logs yet</p></div>
            )}
          </div>
          {logMeta.pages > 1 && (
            <div className="pagination">
              <span className="pagination-info">Page {logMeta.page} of {logMeta.pages} · {logMeta.total} total</span>
              <button className="pg-btn" disabled={logMeta.page === 1} onClick={() => fetchLogs(logMeta.page - 1)}>← Prev</button>
              <button className="pg-btn" disabled={logMeta.page === logMeta.pages} onClick={() => fetchLogs(logMeta.page + 1)}>Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
