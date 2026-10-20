import React, { useState, useEffect, useCallback } from 'react';
import { addSales, getSales, deleteSales } from '../api/api';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const SalesPage = () => {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [sales, setSales] = useState([]);
  const [totals, setTotals] = useState({ totalSales: 0, totalIncome: 0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  const fetchSales = useCallback(async () => {
    try {
      const res = await getSales({ month: filterMonth, year: filterYear });
      setSales(res.data.sales);
      setTotals({ totalSales: res.data.totalSales, totalIncome: res.data.totalIncome });
    } catch (err) {
      console.error(err);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || form.amount <= 0) {
      setError('সঠিক পরিমাণ দিন।');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await addSales({ amount: Number(form.amount), date: form.date, description: form.description });
      const income = (Number(form.amount) * 0.12).toFixed(2);
      setMsg(`✅ বিক্রয় সেভ হয়েছে! আয় (১২%): ৳${income}`);
      setForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchSales();
    } catch (err) {
      setError(err.response?.data?.message || 'এরর হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    try {
      await deleteSales(id);
      fetchSales();
    } catch (err) {
      alert('মুছতে সমস্যা হয়েছে।');
    }
  };

  const tk = (a) => `৳${Number(a || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>💰 বিক্রয়ের হিসাব</h2>
        <p>প্রতিদিনের বিক্রয় এখানে লিখুন। ১২% হারে আয় স্বয়ংক্রিয়ভাবে হিসাব হবে।</p>
      </div>

      {/* Income Calculator Info */}
      <div className="info-banner">
        <span>💡</span>
        <p>বিক্রয় পরিমাণের <strong>১২%</strong> স্বয়ংক্রিয়ভাবে আয় হিসেবে গণনা হবে।
        যেমন: ৳১০,০০০ বিক্রয় → ৳১,২০০ আয়</p>
      </div>

      {/* Add Form */}
      <div className="form-card">
        <h3>নতুন বিক্রয় যোগ করুন</h3>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-row">
            <div className="form-group">
              <label>বিক্রয় পরিমাণ (টাকা) *</label>
              <input
                type="number"
                placeholder="যেমন: 10000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                min="1"
                required
              />
              {form.amount > 0 && (
                <small className="income-preview">
                  আয় হবে: ৳{(form.amount * 0.12).toFixed(2)}
                </small>
              )}
            </div>
            <div className="form-group">
              <label>তারিখ</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>বিবরণ (ঐচ্ছিক)</label>
            <input
              type="text"
              placeholder="যেমন: মুদিমাল বিক্রয়"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'সেভ হচ্ছে...' : '+ বিক্রয় যোগ করুন'}
          </button>
        </form>
      </div>

      {/* Filter */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>মাস:</label>
          <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>বছর:</label>
          <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="filter-totals">
          <span>মোট বিক্রয়: <strong>{tk(totals.totalSales)}</strong></span>
          <span>মোট আয়: <strong className="income-text">{tk(totals.totalIncome)}</strong></span>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {sales.length === 0 ? (
          <div className="empty-state">📭 এই মাসে কোনো বিক্রয় নেই।</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>বিক্রয়</th>
                <th>আয় (১২%)</th>
                <th>বিবরণ</th>
                <th>মুছুন</th>
              </tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s._id}>
                  <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                  <td className="amount">{tk(s.amount)}</td>
                  <td className="amount income">{tk(s.income)}</td>
                  <td>{s.description || '—'}</td>
                  <td>
                    <button className="btn btn-danger-sm" onClick={() => handleDelete(s._id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="total-row">
                <td><strong>মোট</strong></td>
                <td className="amount"><strong>{tk(totals.totalSales)}</strong></td>
                <td className="amount income"><strong>{tk(totals.totalIncome)}</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default SalesPage;
