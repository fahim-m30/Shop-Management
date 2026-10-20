import React, { useState, useEffect, useCallback } from 'react';
import { addStock, getStock, deleteStock } from '../api/api';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const StockPage = () => {
  const [form, setForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
  const [stocks, setStocks] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await getStock({ month: filterMonth, year: filterYear });
      setStocks(res.data.stocks);
      setTotalAmount(res.data.totalAmount);
    } catch (err) {
      console.error(err);
    }
  }, [filterMonth, filterYear]);

  useEffect(() => {
    fetchStocks();
  }, [fetchStocks]);

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
      await addStock({ amount: Number(form.amount), date: form.date, description: form.description });
      setMsg('✅ মাল ঢোকার তথ্য সফলভাবে সেভ হয়েছে!');
      setForm({ amount: '', date: new Date().toISOString().split('T')[0], description: '' });
      fetchStocks();
    } catch (err) {
      setError(err.response?.data?.message || 'এরর হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    try {
      await deleteStock(id);
      fetchStocks();
    } catch (err) {
      alert('মুছতে সমস্যা হয়েছে।');
    }
  };

  const tk = (a) => `৳${Number(a || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>📦 মাল ঢোকার হিসাব</h2>
        <p>দোকানে কত টাকার মাল ঢুকেছে তা এখানে লিখুন।</p>
      </div>

      {/* Add Form */}
      <div className="form-card">
        <h3>নতুন এন্ট্রি যোগ করুন</h3>
        {msg && <div className="alert alert-success">{msg}</div>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}
        <form onSubmit={handleSubmit} className="entry-form">
          <div className="form-row">
            <div className="form-group">
              <label>পরিমাণ (টাকা) *</label>
              <input
                type="number"
                placeholder="যেমন: 5000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                min="1"
                required
              />
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
              placeholder="যেমন: চাল, ডাল, তেল"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'সেভ হচ্ছে...' : '+ এন্ট্রি যোগ করুন'}
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
        <div className="filter-total">
          মোট: <strong>{tk(totalAmount)}</strong>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {stocks.length === 0 ? (
          <div className="empty-state">📭 এই মাসে কোনো এন্ট্রি নেই।</div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>পরিমাণ</th>
                <th>বিবরণ</th>
                <th>মুছুন</th>
              </tr>
            </thead>
            <tbody>
              {stocks.map(s => (
                <tr key={s._id}>
                  <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                  <td className="amount">{tk(s.amount)}</td>
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
                <td className="amount"><strong>{tk(totalAmount)}</strong></td>
                <td colSpan="2"></td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
};

export default StockPage;
