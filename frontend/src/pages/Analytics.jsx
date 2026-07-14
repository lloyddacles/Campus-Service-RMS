import { useState, useEffect } from 'react';
import api from '../api';

const statusColors = { submitted: '#3b82f6', pending_approval: '#f59e0b', in_progress: '#8b5cf6', resolved: '#22c55e', closed: '#6b7280' };
const priorityColors = { low: '#6b7280', medium: '#f59e0b', high: '#ef4444', critical: '#dc2626' };

export default function Analytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics')
      .then(({ data }) => setStats(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="loading">Loading analytics...</p>;
  if (!stats) return <p className="empty">Could not load analytics.</p>;

  const maxCat = Math.max(...stats.byCategory.map((c) => c.count), 1);
  const maxWeekly = Math.max(...stats.weekly.map((w) => w.count), 1);

  return (
    <div className="analytics-page">
      <h1>Analytics</h1>

      <div className="stats-grid">
        <div className="stat-card"><span className="stat-num">{stats.total}</span><span className="stat-label">Total Requests</span></div>
        <div className="stat-card"><span className="stat-num">{stats.byStatus.filter((s) => s.status === 'resolved' || s.status === 'closed').reduce((a, b) => a + b.count, 0)}</span><span className="stat-label">Resolved</span></div>
        <div className="stat-card"><span className="stat-num">{stats.avgResolutionHours}h</span><span className="stat-label">Avg Resolution</span></div>
        <div className="stat-card"><span className="stat-num">{stats.byStatus.find((s) => s.status === 'pending_approval')?.count || 0}</span><span className="stat-label">Pending Approval</span></div>
      </div>

      <div className="chart-row">
        <div className="chart-card">
          <h3>By Status</h3>
          {stats.byStatus.map((s) => (
            <div key={s.status} className="chart-bar-row">
              <span className="chart-label">{s.status.replace('_', ' ')}</span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(s.count / Math.max(...stats.byStatus.map((x) => x.count), 1)) * 100}%`, background: statusColors[s.status] || '#94a3b8' }} />
              </div>
              <span className="chart-value">{s.count}</span>
            </div>
          ))}
        </div>

        <div className="chart-card">
          <h3>By Priority</h3>
          {stats.byPriority.map((p) => (
            <div key={p.priority} className="chart-bar-row">
              <span className="chart-label">{p.priority}</span>
              <div className="chart-bar-track">
                <div className="chart-bar-fill" style={{ width: `${(p.count / Math.max(...stats.byPriority.map((x) => x.count), 1)) * 100}%`, background: priorityColors[p.priority] || '#94a3b8' }} />
              </div>
              <span className="chart-value">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="chart-card full">
        <h3>Requests by Category</h3>
        {stats.byCategory.map((c) => (
          <div key={c.category} className="chart-bar-row">
            <span className="chart-label">{c.category}</span>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ width: `${(c.count / maxCat) * 100}%`, background: 'var(--primary)' }} />
            </div>
            <span className="chart-value">{c.count}</span>
          </div>
        ))}
      </div>

      <div className="chart-card full">
        <h3>Last 30 Days</h3>
        <div className="weekly-chart">
          {stats.weekly.map((w) => (
            <div key={w.day} className="weekly-bar-wrapper" title={`${w.day}: ${w.count} requests`}>
              <div className="weekly-bar" style={{ height: `${(w.count / maxWeekly) * 120}px`, background: 'var(--primary)' }} />
              <span className="weekly-label">{w.day.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
