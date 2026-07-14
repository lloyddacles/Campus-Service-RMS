import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export default function Templates() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [templates, setTemplates] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', category: '', title: '', description: '', priority: 'medium', auto_assign_to: '' });

  const categories = ['Facilities', 'IT Support', 'Cleaning', 'Security', 'Administrative', 'Academic', 'Other'];

  const fetchData = async () => {
    const [tRes, sRes] = await Promise.all([
      api.get('/templates'),
      api.get('/users?role=staff'),
    ]);
    setTemplates(tRes.data);
    setStaff(sRes.data);
  };

  useEffect(() => { fetchData(); }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async (e) => {
    e.preventDefault();
    await api.post('/templates', { ...form, auto_assign_to: form.auto_assign_to || null });
    addToast('Template created');
    setShowForm(false);
    setForm({ name: '', category: '', title: '', description: '', priority: 'medium', auto_assign_to: '' });
    fetchData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/templates/${id}`);
    addToast('Template deleted');
    fetchData();
  };

  return (
    <div className="templates-page">
      <div className="page-header">
        <h1>Request Templates</h1>
        {user.role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="btn-secondary">
            {showForm ? 'Cancel' : '+ New Template'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="create-form" style={{ marginBottom: 24 }}>
          <input name="name" placeholder="Template name" value={form.name} onChange={handleChange} required />
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <input name="title" placeholder="Default title" value={form.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Default description" value={form.description} onChange={handleChange} rows={3} required />
          <select name="priority" value={form.priority} onChange={handleChange}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option>
          </select>
          <select name="auto_assign_to" value={form.auto_assign_to} onChange={handleChange}>
            <option value="">No auto-assign</option>
            {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button type="submit">Create Template</button>
        </form>
      )}

      {templates.length === 0 ? (
        <p className="empty">No templates yet.</p>
      ) : (
        <div className="template-list">
          {templates.map((t) => (
            <div key={t.id} className="template-card">
              <div className="template-header">
                <strong>{t.name}</strong>
                <span className="badge" style={{ background: '#6366f1' }}>{t.category}</span>
              </div>
              <p className="template-desc">{t.description}</p>
              <div className="template-meta">
                <span>Priority: {t.priority}</span>
                {t.assignee_name && <span>Auto-assign: {t.assignee_name}</span>}
              </div>
              {user.role === 'admin' && (
                <button onClick={() => handleDelete(t.id)} className="btn-link" style={{ marginTop: 8 }}>Delete</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
