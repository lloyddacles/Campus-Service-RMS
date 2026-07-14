import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const statuses = ['submitted', 'in_progress', 'resolved', 'closed'];
const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };

export default function AdminPanel() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reqRes, staffRes] = await Promise.all([
        api.get('/requests'),
        api.get('/users?role=staff'),
      ]);
      setRequests(reqRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (id, status) => {
    await api.patch(`/requests/${id}/status`, { status });
    addToast(`Request #${id} status updated`);
    fetchData();
  };

  const assignStaff = async (id, assigned_to) => {
    await api.patch(`/requests/${id}/assign`, { assigned_to });
    addToast(`Request #${id} assigned`);
    fetchData();
  };

  if (loading) return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <div className="request-list">
        {[1,2,3].map((i) => <div key={i} className="request-card"><div className="skeleton skeleton-card" /></div>)}
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <div className="request-list">
        {requests.map((req) => (
          <div key={req.id} className="request-card admin-card">
            <div className="request-header">
              <span className="request-id">#{req.id}</span>
              <select
                value={req.status}
                onChange={(e) => updateStatus(req.id, e.target.value)}
                className="status-select"
                style={{ background: statusColors[req.status], color: '#fff' }}
              >
                {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <span className="badge" style={{ background: priorityColors[req.priority] }}>{req.priority}</span>
            </div>
            <h3>{req.title}</h3>
            <p className="request-desc">{req.description}</p>
            <div className="request-meta">
              <span>{req.category}</span>
              <span>by {req.requester_name}</span>
              <span className="date">{new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            <div className="admin-actions">
              <label>Assign:</label>
              <select
                value={req.assigned_to || ''}
                onChange={(e) => assignStaff(req.id, e.target.value || null)}
              >
                <option value="">Unassigned</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
