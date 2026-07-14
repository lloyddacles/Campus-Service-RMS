import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

export default function PendingApprovals() {
  const { addToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const { data } = await api.get('/approvals/pending');
      setRequests(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPending(); }, []);

  const handleReview = async (id, action) => {
    await api.patch(`/approvals/${id}/review`, { action });
    addToast(action === 'approved' ? 'Request approved' : 'Request rejected');
    fetchPending();
  };

  if (loading) return (
    <div className="approvals-page">
      <h1>Pending Approvals</h1>
      <div className="request-list">{[1,2].map((i) => <div key={i} className="request-card"><div className="skeleton skeleton-card" /></div>)}</div>
    </div>
  );

  return (
    <div className="approvals-page">
      <h1>Pending Approvals</h1>
      {requests.length === 0 ? (
        <p className="empty">No requests pending approval.</p>
      ) : (
        <div className="request-list">
          {requests.map((req) => (
            <div key={req.id} className="request-card">
              <div className="request-header">
                <span className="request-id">#{req.id}</span>
                <span className="badge" style={{ background: priorityColors[req.priority] }}>{req.priority}</span>
                <span className="badge" style={{ background: '#f59e0b' }}>Pending Approval</span>
              </div>
              <h3>{req.title}</h3>
              <p className="request-desc">{req.description}</p>
              <div className="request-meta">
                <span>{req.category}</span>
                <span>by {req.requester_name}</span>
                <span className="date">{new Date(req.created_at).toLocaleDateString()}</span>
              </div>
              <div className="approval-actions">
                <button onClick={() => handleReview(req.id, 'approved')} className="btn-approve">✓ Approve</button>
                <button onClick={() => handleReview(req.id, 'rejected')} className="btn-reject">✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
