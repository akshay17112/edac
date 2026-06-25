import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setError('Please fill in all fields.'); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      login(res.data.access_token, res.data.user);
      navigate(res.data.user.role === 'admin' ? '/admin' : '/chat');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-panel">
        <div className="auth-panel-bg" />
        <div className="auth-panel-grid" />
        <div className="auth-panel-logo">EDAC <span /></div>
        <div className="auth-panel-body">
          <h2>Your workspace, secured and ready.</h2>
          <p>Sign in to continue to your chat assistant and admin tools.</p>
        </div>
        <div className="auth-panel-features">
          <div className="auth-feature"><span className="auth-feature-dot" />Role-based access control</div>
          <div className="auth-feature"><span className="auth-feature-dot" />JWT-secured sessions</div>
          <div className="auth-feature"><span className="auth-feature-dot" />Full activity logging</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Welcome back</h2>
          <p className="auth-sub">Sign in to your account to continue</p>

          {error && <div className="error-banner" role="alert">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={error ? 'input-error' : ''}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                autoComplete="current-password"
                className={error ? 'input-error' : ''}
              />
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>

          <div className="demo-creds">
            <strong>Demo admin</strong><br />
            admin@edac.com · Admin@123
          </div>
        </div>
      </div>
    </div>
  );
}
