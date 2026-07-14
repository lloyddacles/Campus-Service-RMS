import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', in_progress: '#f59e0b', resolved: '#22c55e', closed: '#6b7280' };
const statuses = ['submitted', 'in_progress', 'resolved', 'closed'];

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
      console.error(err);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleStatusChange = async (status) => {
    await api.patch(`/requests/${id}/status`, { status });
    fetchData();
  };

  const handleAssign = async (assigned_to) => {
    await api.patch(`/requests/${id}/assign`, { assigned_to });
    fetchData();
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    await api.post(`/comments/request/${id}`, { content: newComment, is_internal: isInternal });
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

  if (loading) return <p className="loading">Loading...</p>;
  if (!request) return null;

  return (
    <div className="detail-page">
      <button onClick={() => navigate('/')} className="btn-secondary">&larr; Back</button>

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
                {statuses.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            ) : (
              <span className="badge" style={{ background: statusColors[request.status] }}>
                {request.status.replace('_', ' ')}
              </span>
            )}
            <span className="badge" style={{ background: priorityColors[request.priority] }}>
              {request.priority}
            </span>
          </div>
        </div>

        <div className="detail-meta">
          <div><strong>Category:</strong> {request.category}</div>
          {request.location && <div><strong>Location:</strong> {request.location}</div>}
          <div><strong>Submitted by:</strong> {request.requester_name}</div>
          <div><strong>Date:</strong> {new Date(request.created_at).toLocaleString()}</div>
          {request.assigned_name && <div><strong>Assigned to:</strong> {request.assigned_name}</div>}
        </div>

        <div className="detail-description">
          <h3>Description</h3>
          <p>{request.description}</p>
        </div>

        {user.role !== 'student' && (
          <div className="detail-assign">
            <label>Assign to:</label>
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
        <div className="attachment-list">
          {attachments.map((att) => (
            <div key={att.id} className="attachment-item" onClick={() => handleDownload(att)}>
              <span className="att-icon">&#128206;</span>
              <span className="att-name">{att.original_name}</span>
              <span className="att-size">{(att.size / 1024).toFixed(1)} KB</span>
            </div>
          ))}
        </div>
        <input type="file" ref={fileRef} onChange={handleFileUpload} hidden />
        <button onClick={() => fileRef.current.click()} className="btn-secondary" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload File'}
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
                <span className={c.is_internal ? 'badge-internal' : ''}>
                  {c.is_internal ? 'Internal' : c.user_role}
                </span>
                <span className="date">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p>{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && <p className="empty">No comments yet.</p>}
        </div>

        <form onSubmit={handleComment} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Add a comment..."
            rows={3}
          />
          <div className="comment-actions">
            {user.role !== 'student' && (
              <label className="internal-toggle">
                <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} />
                Internal note (staff only)
              </label>
            )}
            <button type="submit">Post Comment</button>
          </div>
        </form>
      </div>
    </div>
  );
}
