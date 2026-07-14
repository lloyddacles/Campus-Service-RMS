import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="nav-brand">Campus RMS</Link>
      <div className="nav-links">
        <Link to="/">Dashboard</Link>
        <Link to="/create">New Request</Link>
        {user.role !== 'student' && <Link to="/admin">Admin</Link>}
        <span className="nav-user">{user.name} ({user.role})</span>
        <button onClick={handleLogout} className="btn-link">Logout</button>
      </div>
    </nav>
  );
}
