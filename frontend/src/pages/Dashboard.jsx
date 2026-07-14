import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };
const statusColors = { submitted: '#3b82f6', pending_approval: '#f59e0b', in_progress: '#8b5cf6', resolved: '#22c55e', closed: '#6b7280' };
const categoryIcons = {
  Facilities: '🏢', 'IT Support': '💻', Cleaning: '🧹',
  Security: '🔒', Administrative: '📋', Academic: '📚', Other: '📌',
};

function SkeletonCards() {
  return (
    <div className="request-list">
      {[1,2,3].map((i) => (
        <div key={i} className="request-card">
          <div className="skeleton skeleton-card" />
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({ requests: [], pagination: { page: 1, totalPages: 1 } });
  const [filters, setFilters] = useState({ status: '', priority: '', category: '', search: '', page: 1 });
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v !== ''));
      const { data } = await api.get('/requests', { params });
      setData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, [filters.status, filters.priority, filters.category, filters.search, filters.page]);

  const handleSearch = (e) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const goPage = (p) => setFilters((f) => ({ ...f, page: p }));
  const { requests, pagination } = data;

  return (
    <div className="dashboard">
      <h1>Service Requests</h1>

      <div className="filters">
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text" placeholder="Search by title, description, or ID..."
            value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn-secondary">Search</button>
          {filters.search && (
            <button type="button" className="btn-link" onClick={() => { setSearchInput(''); setFilters((f) => ({ ...f, search: '', page: 1 })); }}>
              Clear
            </button>
          )}
        </form>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}>
          <option value="">All Statuses</option>
          <option value="submitted">Submitted</option>
          <option value="pending_approval">Pending Approval</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select value={filters.priority} onChange={(e) => setFilters({ ...filters, priority: e.target.value, page: 1 })}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <button onClick={fetchRequests} className="btn-secondary">⟳ Refresh</button>
      </div>

      {loading ? (
        <SkeletonCards />
      ) : requests.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: '2rem', marginBottom: 8 }}>📭</p>
          <p>{filters.search ? 'No results for your search.' : 'No requests found.'}</p>
          {!filters.search && (
            <button onClick={() => navigate('/create')} className="btn-secondary" style={{ marginTop: 12 }}>
              + Create one
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="request-list">
            {requests.map((req) => (
              <div
                key={req.id}
                className="request-card clickable"
                onClick={() => navigate(`/requests/${req.id}`)}
              >
                <div className="request-header">
                  <span className="request-id">#{req.id}</span>
                  <span className="badge" style={{ background: statusColors[req.status] || '#94a3b8' }}>
                    {req.status.replace('_', ' ')}
                  </span>
                  <span className="badge" style={{ background: priorityColors[req.priority] }}>
                    {req.priority}
                  </span>
                </div>
                <h3>{req.title}</h3>
                <p className="request-desc">{req.description}</p>
                <div className="request-meta">
                  <span><span className="cat-icon">{categoryIcons[req.category] || '📌'}</span>{req.category}</span>
                  {req.location && <span>📍 {req.location}</span>}
                  <span>👤 {req.requester_name}</span>
                  {req.assigned_name && <span>✅ {req.assigned_name}</span>}
                </div>
                <div className="request-footer">
                  <span className="date">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="pagination">
              <button disabled={pagination.page <= 1} onClick={() => goPage(pagination.page - 1)} className="btn-secondary">
                &larr; Prev
              </button>
              <span className="page-info">Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => goPage(pagination.page + 1)} className="btn-secondary">
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
