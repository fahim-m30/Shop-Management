import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(`সার্ভার কানেকশন এরর (${err.message})। ব্যাকএন্ড লাইভ আছে কি না চেক করুন।`);
      } else {
        setError('লগইন ব্যর্থ হয়েছে। সার্ভারে পৌঁছানো যাচ্ছে না।');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-icon">🏪</div>
          <h1>দোকান ম্যানেজার</h1>
          <p>আপনার একাউন্টে লগইন করুন</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>ইমেইল</label>
            <input
              type="email"
              placeholder="আপনার ইমেইল"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
            />
          </div>
          <div className="form-group">
            <label>পাসওয়ার্ড</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="আপনার পাসওয়ার্ড"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                style={{ paddingRight: '45px', width: '100%' }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'rgba(241, 245, 249, 0.9)',
                  border: '1px solid #cbd5e1',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  padding: '6px 12px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  transition: 'all 0.15s ease'
                }}
              >
                {showPassword ? '🙈 লুকান' : '👁️ দেখুন'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
          </button>
        </form>

        <p className="auth-switch">
          নতুন একাউন্ট?{' '}
          <button onClick={onSwitch} className="link-btn">রেজিস্ট্রেশন করুন</button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
