import { useState, useEffect } from 'react';
import api from '../api';
import { useToast } from '../context/ToastContext';

const statuses = ['submitted', 'pending_approval', 'in_progress', 'resolved', 'closed'];
const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', pending_approval: '#f59e0b', in_progress: '#8b5cf6', resolved: '#22c55e', closed: '#6b7280' };

export default function AdminPanel() {
  const { addToast } = useToast();
  const [data, setData] = useState({ requests: [], pagination: { page: 1, totalPages: 1 } });
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const [reqRes, staffRes] = await Promise.all([
        api.get('/requests', { params }),
        api.get('/users?role=staff'),
      ]);
      setData(reqRes.data);
      setStaff(staffRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [page, search]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

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

  const { requests, pagination } = data;

  if (loading) return (
    <div className="admin-panel">
      <h1>Manage Requests</h1>
      <div className="request-list">
        {[1,2,3].map((i) => <div key={i} className="request-card"><div className="skeleton skeleton-card" /></div>)}
      </div>
    </div>
  );

  return (
    <div className="admin-panel">
      <h1>Manage Requests</h1>

      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input type="text" placeholder="Search by title, description, or ID..."
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="search-input" />
          <button type="submit" className="btn-secondary">Search</button>
          {search && (
            <button type="button" className="btn-link" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }}>
              Clear
            </button>
          )}
        </form>
      </div>

      {requests.length === 0 ? (
        <p className="empty">{search ? 'No results found.' : 'No requests yet.'}</p>
      ) : (
        <>
          <div className="request-list">
            {requests.map((req) => (
              <div key={req.id} className="request-card admin-card">
                <div className="request-header">
                  <span className="request-id">#{req.id}</span>
                  <select
                    value={req.status}
                    onChange={(e) => updateStatus(req.id, e.target.value)}
                    className="status-select"
                    style={{ background: statusColors[req.status] || '#94a3b8', color: '#fff' }}
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

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button disabled={pagination.page <= 1} onClick={() => setPage(pagination.page - 1)} className="btn-secondary">
                &larr; Prev
              </button>
              <span className="page-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => setPage(pagination.page + 1)} className="btn-secondary">
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
