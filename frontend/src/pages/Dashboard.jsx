import { useState, useEffect } from 'react';
import api from '../api';

const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({ status: '', priority: '', category: '' });
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
      const { data } = await api.get('/requests', { params });
      setRequests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filters]);

  return (
    <div className="dashboard">
      <h1>Service Requests</h1>

      <div className="filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value })}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={fetchRequests} className="btn-secondary">Refresh</button>
      </div>

      {loading ? (
        <p className="loading">Loading...</p>
      ) : requests.length === 0 ? (
        <p className="empty">No requests found.</p>
      ) : (
        <div className="request-list">
          {requests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-header">
                <span className="request-id">#{req.id}</span>
                <span className="badge" style={{ background: statusColors[req.status] }}>
                  {req.status.replace('_', ' ')}
                </span>
                <span className="badge" style={{ background: priorityColors[req.priority] }}>
                  {req.priority}
                </span>
              </div>
              <h3>{req.title}</h3>
              <p className="request-desc">{req.description}</p>
              <div className="request-meta">
                <span>{req.category}</span>
                {req.location && <span>{req.location}</span>}
                <span>by {req.requester_name}</span>
                {req.assigned_name && <span>Assigned: {req.assigned_name}</span>}
              </div>
              <div className="request-footer">
                <span className="date">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
