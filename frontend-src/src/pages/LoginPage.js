import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = ({ onSwitch }) => {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [slowServerHint, setSlowServerHint] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setSlowServerHint(true);
      }, 2500);
    } else {
      setSlowServerHint(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(form.email.trim().toLowerCase(), form.password);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message && err.message.includes('timeout')) {
        setError('সার্ভার সাড়া দিতে সময় নিচ্ছে। অনুগ্রহ করে আর একবার চেষ্টা করুন।');
      } else if (err.message) {
        setError(`সার্ভার কানেকশন সমস্যা (${err.message})। ব্যাকএন্ড জাগ্রত হচ্ছে, আবার চেষ্টা করুন।`);
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

          {slowServerHint && loading && (
            <div style={{
              marginTop: '14px',
              padding: '10px 14px',
              background: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: '10px',
              fontSize: '13px',
              color: '#0f766e',
              textAlign: 'center',
              lineHeight: '1.4'
            }}>
              ⏳ ক্লাউড সার্ভার প্রস্তুত হচ্ছে... প্রথমবার ২০-৩০ সেকেন্ড সময় লাগতে পারে, অনুগ্রহ করে অপেক্ষা করুন।
            </div>
          )}
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
