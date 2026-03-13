import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AuthPage.css';

const Logo = () => (
  <div className="auth-logo">
    <div className="auth-logo-icon">
      <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="3" width="8" height="8" rx="2" fill="currentColor"/>
        <rect x="13" y="3" width="8" height="8" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="3" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".5"/>
        <rect x="13" y="13" width="8" height="8" rx="2" fill="currentColor" opacity=".25"/>
      </svg>
    </div>
    <span>CollabTask</span>
  </div>
);

const Check = () => (
  <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
);

export function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try { await login(form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Login failed. Check your credentials.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel-left">
        <Logo />
        <div className="auth-hero">
          <h1>Welcome back.</h1>
          <p>Your team's work is waiting for you. Sign in and pick up right where you left off.</p>
        </div>
        <ul className="auth-features">
          {['Drag-and-drop Kanban boards','Real-time team collaboration','Smart notifications & deadlines','Task comments & activity logs'].map(f => (
            <li key={f}><span className="check-icon"><Check /></span>{f}</li>
          ))}
        </ul>
        <div className="auth-decoration">
          <div className="deco-card">
            <div className="deco-dots">
              <span style={{background:'#e85d26'}}/>
              <span style={{background:'#f59e0b'}}/>
              <span style={{background:'#16a34a'}}/>
            </div>
            <div className="deco-bar" style={{width:'80%'}}/>
            <div className="deco-bar" style={{width:'55%'}}/>
            <div className="deco-bar" style={{width:'70%'}}/>
          </div>
        </div>
      </div>

      <div className="auth-panel auth-panel-right">
        <div className="auth-form-card fade-up">
          <h2>Sign in to your account</h2>
          <p className="auth-sub">Don't have an account? <Link to="/signup">Create one free →</Link></p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input className="form-input" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Sign in'}
            </button>
          </form>

          <div className="auth-hint">
            <strong>Demo:</strong> <code>demo@collabtask.com</code> / <code>demo1234</code>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault(); setError(''); 
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try { await signup(form.name, form.email, form.password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Signup failed. Please try again.'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-panel auth-panel-left">
        <Logo />
        <div className="auth-hero">
          <h1>Build great things, together.</h1>
          <p>Set up your team workspace in seconds. Invite anyone, assign tasks, ship faster.</p>
        </div>
        <ul className="auth-features">
          {['Unlimited projects & tasks','Invite teammates by email','Kanban boards with drag & drop','Live updates across your team'].map(f => (
            <li key={f}><span className="check-icon"><Check /></span>{f}</li>
          ))}
        </ul>
      </div>

      <div className="auth-panel auth-panel-right">
        <div className="auth-form-card fade-up">
          <h2>Create your account</h2>
          <p className="auth-sub">Already have one? <Link to="/login">Sign in →</Link></p>

          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input className="form-input" type="text" placeholder="Jane Smith"
                value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Work email</label>
              <input className="form-input" type="email" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} required />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner"/> : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
