import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '', name: '', role: 'student' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(form.email, form.password, form.name, form.role);
      addToast('Account created!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Create Account</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 24, fontSize: '0.85rem' }}>
          Join the Campus Service platform
        </p>
        {error && <p className="error">{error}</p>}
        <input name="name" placeholder="Full Name" value={form.name}
          onChange={handleChange} required />
        <input name="email" type="email" placeholder="Email" value={form.email}
          onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password" value={form.password}
          onChange={handleChange} required />
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="student">Student</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
        <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
      </form>
    </div>
  );
}
