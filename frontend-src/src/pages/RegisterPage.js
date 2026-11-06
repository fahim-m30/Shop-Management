import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = ({ onSwitch }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '' });
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
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.shopName.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
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
          <p>নতুন একাউন্ট তৈরি করুন</p>
        </div>

        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>আপনার নাম</label>
            <input
              type="text"
              placeholder="মোহাম্মদ রহিম"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>দোকানের নাম</label>
            <input
              type="text"
              placeholder="রহিম স্টোর"
              value={form.shopName}
              onChange={(e) => setForm({ ...form, shopName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>ইমেইল</label>
            <input
              type="email"
              placeholder="example@gmail.com"
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
                placeholder="কমপক্ষে ৬ সংখ্যার পাসওয়ার্ড"
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
                  gap: '4px'
                }}
              >
                {showPassword ? '🙈 লুকান' : '👁️ দেখুন'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'অ্যাকাউন্ট তৈরি হচ্ছে...' : 'রেজিস্ট্রেশন সম্পন্ন করুন'}
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
          ইতিমধ্যে একাউন্ট আছে?{' '}
          <button onClick={onSwitch} className="link-btn">লগইন করুন</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
