import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = ({ onSwitch }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password, form.shopName.trim());
    } catch (err) {
      setError(err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
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
                placeholder="কমপক্ষে ৬ অক্ষর"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
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
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px',
                  color: '#6b7280'
                }}
                title={showPassword ? 'লুকান' : 'দেখুন'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'তৈরি হচ্ছে...' : 'একাউন্ট তৈরি করুন'}
          </button>
        </form>

        <p className="auth-switch">
          আগে থেকে একাউন্ট আছে?{' '}
          <button onClick={onSwitch} className="link-btn">লগইন করুন</button>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
