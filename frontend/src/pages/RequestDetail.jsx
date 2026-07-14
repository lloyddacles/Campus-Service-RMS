import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };
const statuses = ['submitted', 'in_progress', 'resolved', 'closed'];
const statusLabels = { submitted: 'Submitted', in_progress: 'In Progress', resolved: 'Resolved', closed: 'Closed' };

const timelineOrder = ['submitted', 'in_progress', 'resolved', 'closed'];

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  const [request, setRequest] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [staff, setStaff] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileRef = useRef();

  const fetchData = async () => {
    try {
      const [reqRes, comRes, attRes] = await Promise.all([
        api.get(`/requests/${id}`),
        api.get(`/comments/request/${id}`),
        api.get(`/attachments/request/${id}`),
      ]);
      setRequest(reqRes.data);
      setComments(comRes.data);
      setAttachments(attRes.data);
      if (user.role !== 'student') {
        const { data } = await api.get('/users?role=staff');
        setStaff(data);
      }
    } catch (err) {
      addToast('Could not load request', 'error');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status) => {
    await api.patch(`/requests/${id}/status`, { status });
    addToast(`Status changed to ${statusLabels[status]}`);
    fetchData();
  };

  const handleAssign = async (assigned_to) => {
    await api.patch(`/requests/${id}/assign`, { assigned_to });
    addToast('Request assigned');
    fetchData();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await api.post(`/comments/request/${id}`, { content: newComment, is_internal: isInternal });
    addToast('Comment posted');
    setNewComment('');
    setIsInternal(false);
    fetchData();
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append('file', file);
    await api.post(`/attachments/request/${id}`, form);
    addToast('File uploaded');
    fileRef.current.value = '';
    setUploading(false);
    fetchData();
  };

  const handleDownload = async (att) => {
    const { data } = await api.get(`/attachments/${att.id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = att.original_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="detail-page">
        <div className="skeleton" style={{ width: 80, height: 36, marginBottom: 20 }} />
        <div className="detail-card">
          <div className="skeleton" style={{ width: '60%', height: 28, marginBottom: 16 }} />
          <div className="skeleton" style={{ width: '100%', height: 16, marginBottom: 8 }} />
          <div className="skeleton" style={{ width: '80%', height: 16 }} />
        </div>
      </div>
    );
  }
  if (!request) return null;

  const currentIdx = timelineOrder.indexOf(request.status);

  return (
    <div className="detail-page">
      <button onClick={() => navigate('/')} className="btn-secondary">&larr; Back to Dashboard</button>

      {/* Status Timeline */}
      <div className="detail-card" style={{ marginTop: 16 }}>
        <div className="status-timeline">
          {timelineOrder.map((s, i) => (
            <div key={s} className={`timeline-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''}`}>
              <div className="dot">{i < currentIdx ? '✓' : i + 1}</div>
              <div>{statusLabels[s]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="detail-card">
        <div className="detail-header">
          <div>
            <h1>{request.title}</h1>
            <span className="request-id">#{request.id}</span>
          </div>
          <div className="detail-badges">
            {user.role !== 'student' ? (
              <select
                value={request.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="status-select"
                style={{ background: statusColors[request.status], color: '#fff' }}
              >
                {statuses.map((s) => <option key={s} value={s}>{statusLabels[s]}</option>)}
              </select>
            ) : (
              <span className="badge" style={{ background: statusColors[request.status] }}>
                {statusLabels[request.status]}
              </span>
            )}
            <span className="badge" style={{ background: priorityColors[request.priority] }}>
              {request.priority}
            </span>
          </div>
        </div>

        <div className="detail-meta">
          <div><strong>Category</strong><br/>{request.category}</div>
          {request.location && <div><strong>Location</strong><br/>{request.location}</div>}
          <div><strong>Submitted by</strong><br/>{request.requester_name}</div>
          <div><strong>Date</strong><br/>{new Date(request.created_at).toLocaleDateString()}</div>
          {request.assigned_name && <div><strong>Assigned to</strong><br/>{request.assigned_name}</div>}
        </div>

        <div className="detail-description">
          <h3>Description</h3>
          <p>{request.description}</p>
        </div>

        {user.role !== 'student' && (
          <div className="detail-assign">
            <label><strong>Assign to:</strong></label>
            <select value={request.assigned_to || ''} onChange={(e) => handleAssign(e.target.value || null)}>
              <option value="">Unassigned</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Attachments */}
      <div className="detail-section">
        <h2>Attachments</h2>
        {attachments.length > 0 ? (
          <div className="attachment-list">
            {attachments.map((att) => (
              <div key={att.id} className="attachment-item" onClick={() => handleDownload(att)}>
                <span className="att-icon">📎</span>
                <span className="att-name">{att.original_name}</span>
                <span className="att-size">{(att.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty" style={{ padding: 20 }}>No attachments yet.</p>
        )}
        <input type="file" ref={fileRef} onChange={handleFileUpload} hidden />
        <button onClick={() => fileRef.current.click()} className="btn-secondary" disabled={uploading}>
          {uploading ? '⏳ Uploading...' : '📤 Upload File'}
        </button>
      </div>

      {/* Comments */}
      <div className="detail-section">
        <h2>Comments</h2>
        <div className="comment-list">
          {comments.map((c) => (
            <div key={c.id} className={`comment ${c.is_internal ? 'internal' : ''}`}>
              <div className="comment-header">
                <strong>{c.user_name}</strong>
                {c.is_internal && <span className="badge-internal">Internal</span>}
                <span className="date">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p>{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="empty" style={{ padding: 20 }}>No comments yet. Start the conversation!</p>}
        </div>

        <form onSubmit={handleComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            rows={3}
          />
          <div className="comment-actions">
            {user.role !== 'student' && (
              <label className="internal-toggle">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                Internal note
              </label>
            )}
            <button type="submit">Post Comment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
