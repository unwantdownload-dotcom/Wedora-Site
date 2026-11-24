import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Lock, User, Shield, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, isSupabaseConfigured } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      showToast('Please enter your admin username', 'warning');
      return;
    }
    if (!password.trim()) {
      showToast('Please enter your password', 'warning');
      return;
    }
    setLoading(true);
    try {
      const loggedUser = await login(username.trim(), password);
      showToast(`Welcome back, ${loggedUser.full_name}! 🍫`, 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Login failed. Please check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="login-page"
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--navy-950)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        backgroundImage: 'radial-gradient(ellipse at top, rgba(27, 47, 73, 0.5) 0%, rgba(6, 13, 23, 0.95) 100%)'
      }}
    >
      <div
        className="login-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(212, 175, 55, 0.25)'
        }}
      >
        {/* Official Brand Logo Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <img
            src="/logo.png"
            alt="Wedora Fine Chocolate"
            style={{
              width: '160px',
              height: 'auto',
              margin: '0 auto 0.75rem',
              display: 'block',
              filter: 'drop-shadow(0 4px 12px rgba(212, 175, 55, 0.25))'
            }}
          />
          <p style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--gold-600)', fontWeight: 700 }}>
            Administrator Portal
          </p>
        </div>

        {/* Regular Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              {isSupabaseConfigured ? 'Account Email' : 'Admin Username'}
            </label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="username"
                type="text"
                className="form-input input-with-icon"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isSupabaseConfigured ? 'Enter your account email' : 'Enter admin username'}
                autoComplete="username"
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Admin Password</label>
            <div className="input-icon-wrapper">
              <Lock size={16} className="input-icon" />
              <input
                id="password"
                type="password"
                className="form-input input-with-icon"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.8rem' }}
            loading={loading}
          >
            Sign In as Admin
          </Button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          {isSupabaseConfigured ? (
            <span>Connected to Supabase PostgreSQL</span>
          ) : (
            <span>Wedora Order Management System</span>
          )}
        </div>
      </div>
    </div>
  );
};
