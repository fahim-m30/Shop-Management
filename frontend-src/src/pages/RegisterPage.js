import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RegisterPage = ({ onSwitch }) => {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', password: '', shopName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(form.name, form.email, form.password, form.shopName);
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
              required
            />
          </div>
          <div className="form-group">
            <label>পাসওয়ার্ড</label>
            <input
              type="password"
              placeholder="কমপক্ষে ৬ অক্ষর"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
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
