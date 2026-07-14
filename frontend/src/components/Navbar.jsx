import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const theme = document.documentElement.getAttribute('data-theme');
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
  };

  if (!user) return null;

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">Campus RMS</Link>
      <button className="nav-hamburger" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? '✕' : '☰'}
      </button>
      <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" className={isActive('/')} onClick={() => setMenuOpen(false)}>Dashboard</Link>
        <Link to="/create" className={isActive('/create')} onClick={() => setMenuOpen(false)}>New Request</Link>
        {user.role !== 'student' && (
          <>
            <Link to="/admin" className={isActive('/admin')} onClick={() => setMenuOpen(false)}>Manage</Link>
            <Link to="/analytics" className={isActive('/analytics')} onClick={() => setMenuOpen(false)}>Analytics</Link>
            <Link to="/templates" className={isActive('/templates')} onClick={() => setMenuOpen(false)}>Templates</Link>
            <Link to="/approvals" className={isActive('/approvals')} onClick={() => setMenuOpen(false)}>Approvals</Link>
          </>
        )}
        <NotificationBell />
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="nav-user">{user.name} ({user.role})</span>
        <button onClick={handleLogout} className="btn-link">Logout</button>
      </div>
    </nav>
  );
}
