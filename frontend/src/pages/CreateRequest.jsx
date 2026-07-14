import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function CreateRequest() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    priority: 'medium',
    location: '',
  });
  const [error, setError] = useState('');

  const categories = [
    'Facilities', 'IT Support', 'Cleaning', 'Security',
    'Administrative', 'Academic', 'Other',
  ];

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/requests', form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create request');
    }
  };

  return (
    <div className="create-page">
      <h1>New Service Request</h1>
      <form onSubmit={handleSubmit} className="create-form">
        {error && <p className="error">{error}</p>}

        <select name="category" value={form.category} onChange={handleChange} required>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <input name="title" placeholder="Title" value={form.title}
          onChange={handleChange} required />

        <textarea name="description" placeholder="Describe the issue..."
          value={form.description} onChange={handleChange} rows={5} required />

        <select name="priority" value={form.priority} onChange={handleChange}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>

        <input name="location" placeholder="Location (optional)" value={form.location}
          onChange={handleChange} />

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}
