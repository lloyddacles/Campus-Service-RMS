import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function NotificationBell() {
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();
  const navigate = useNavigate();

  const fetchCount = async () => {
    try {
      const { data } = await api.get('/notifications/unread-count');
      setCount(data.count);
    } catch {}
  };

  const fetchAll = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data);
    } catch {}
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) fetchAll();
  }, [open]);

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleMarkRead = async (n) => {
    await api.patch(`/notifications/${n.id}/read`);
    fetchCount();
    fetchAll();
    if (n.request_id) navigate(`/requests/${n.request_id}`);
    setOpen(false);
  };

  const handleMarkAllRead = async () => {
    await api.patch('/notifications/read-all');
    setCount(0);
    fetchAll();
  };

  return (
    <div className="notif-wrapper" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(!open)}>
        &#128276;{count > 0 && <span className="notif-count">{count > 9 ? '9+' : count}</span>}
      </button>
      {open && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span>Notifications</span>
            {count > 0 && <button onClick={handleMarkAllRead} className="btn-link">Mark all read</button>}
          </div>
          {notifications.length === 0 ? (
            <p className="empty">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => handleMarkRead(n)}
              >
                <div className="notif-message">{n.message}</div>
                <div className="notif-meta">
                  {n.request_title && <span>{n.request_title}</span>}
                  <span className="date">{new Date(n.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
