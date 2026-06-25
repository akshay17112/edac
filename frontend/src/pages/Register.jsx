import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim())          errs.name     = 'Name is required';
    if (!form.email)                errs.email    = 'Email is required';
    if (form.password.length < 6)   errs.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name, email: form.email, password: form.password,
      });
      login(res.data.access_token, res.data.user);
      navigate('/chat');
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (Array.isArray(detail)) {
        const map = {};
        detail.forEach(e => { if (e.loc?.[1]) map[e.loc[1]] = e.msg; });
        setErrors(map);
      } else {
        setErrors({ general: detail || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const field = (name) => ({
    id: name,
    name,
    value: form[name],
    onChange: handleChange,
    className: errors[name] ? 'input-error' : '',
  });

  return (
    <div className="auth-wrapper">
      <div className="auth-panel">
        <div className="auth-panel-bg" />
        <div className="auth-panel-grid" />
        <div className="auth-panel-logo">EDAC <span /></div>
        <div className="auth-panel-body">
          <h2>Get started in seconds.</h2>
          <p>Create your account to access the chat assistant and your personal workspace.</p>
        </div>
        <div className="auth-panel-features">
          <div className="auth-feature"><span className="auth-feature-dot" />Secure password hashing</div>
          <div className="auth-feature"><span className="auth-feature-dot" />Instant access after signup</div>
          <div className="auth-feature"><span className="auth-feature-dot" />Chat history saved</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-card">
          <h2>Create account</h2>
          <p className="auth-sub">Fill in your details to get started</p>

          {errors.general && <div className="error-banner" role="alert">{errors.general}</div>}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input {...field('name')} type="text" placeholder="John Doe" autoComplete="name" />
              {errors.name && <span className="field-error">{errors.name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input {...field('email')} type="email" placeholder="you@example.com" autoComplete="email" />
              {errors.email && <span className="field-error">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input {...field('password')} type="password" placeholder="Min. 6 characters" autoComplete="new-password" />
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input {...field('confirm')} type="password" placeholder="Repeat password" autoComplete="new-password" />
              {errors.confirm && <span className="field-error">{errors.confirm}</span>}
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? <><span className="spinner" />Creating account…</> : 'Create account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
