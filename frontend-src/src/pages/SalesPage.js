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

  // Real-time synchronization
  useEffect(() => {
    fetchSales();

    const handleSync = () => fetchSales();
    window.addEventListener('shop-sync', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSales();
      }
    }, 6000);

    return () => {
      window.removeEventListener('shop-sync', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
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
      // Notify all other components in real-time
      window.dispatchEvent(new CustomEvent('shop-sync'));
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'এরর হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই বিক্রয় এন্ট্রি মুছে ফেলতে চান?')) return;
    try {
      await deleteSales(id);
      fetchSales();
      window.dispatchEvent(new CustomEvent('shop-sync'));
    } catch (err) {
      alert('মুছতে সমস্যা হয়েছে।');
    }
  };

  const tk = (a) => `৳${Number(a || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}`;

  return (
    <div className="page-content" style={{ paddingBottom: '10px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--stone-900)' }}>
            💰 বিক্রয়ের হিসাব
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--stone-500)', margin: '2px 0 0' }}>
            দৈনিক বিক্রয় এন্ট্রি করুন। ১২% আয় সরাসরি অটোমেটিক গণনা হবে।
          </p>
        </div>

        {/* Filter controls with summary pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select 
            value={filterMonth} 
            onChange={e => setFilterMonth(Number(e.target.value))}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--stone-200)', background: 'var(--white)', fontWeight: 600 }}
          >
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select 
            value={filterYear} 
            onChange={e => setFilterYear(Number(e.target.value))}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--stone-200)', background: 'var(--white)', fontWeight: 600 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <div style={{ background: 'var(--teal-light)', color: 'var(--primary)', border: '1px solid var(--teal-border)', padding: '5px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            বিক্রয়: {tk(totals.totalSales)}
          </div>
          <div style={{ background: 'var(--emerald-light)', color: 'var(--emerald)', border: '1px solid var(--emerald-border)', padding: '5px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            আয়: {tk(totals.totalIncome)}
          </div>
        </div>
      </div>

      {/* Split-Layout: Zero Window Scroll */}
      <div className="split-layout">
        {/* Left: Sticky Compact Form */}
        <div className="form-card split-sticky" style={{ margin: 0, padding: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 14px', paddingBottom: '10px' }}>
            ➕ নতুন বিক্রয় যোগ করুন
          </h3>
          {msg && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '13px' }}>{msg}</div>}
          {error && <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '13px' }}>⚠️ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px' }}>বিক্রয় পরিমাণ (টাকা) *</label>
              <input
                type="number"
                placeholder="যেমন: 10000"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                min="1"
                required
                style={{ padding: '10px 14px' }}
              />
              {form.amount > 0 && (
                <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--emerald)', fontWeight: 700 }}>
                  ✨ ১২% লাভ/আয় হবে: ৳{(form.amount * 0.12).toFixed(2)}
                </div>
              )}
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px' }}>তারিখ</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ padding: '10px 14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px' }}>বিবরণ (ঐচ্ছিক)</label>
              <input
                type="text"
                placeholder="যেমন: মুদিমাল বিক্রয়"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ padding: '10px 14px' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '11px' }}>
              {loading ? 'সেভ হচ্ছে...' : '+ বিক্রয় সেভ করুন'}
            </button>
          </form>
        </div>

        {/* Right: Scrollable Records Table */}
        <div className="compact-table-container">
          {sales.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>📭 এই মাসে কোনো বিক্রয় রেকর্ড নেই।</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>বিক্রয়</th>
                  <th>আয় (১২%)</th>
                  <th>বিবরণ</th>
                  <th style={{ textAlign: 'center' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s._id}>
                    <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                    <td className="amount">{tk(s.amount)}</td>
                    <td className="amount income">{tk(s.income)}</td>
                    <td>{s.description || '—'}</td>
                    <td style={{ textAlign: 'center' }}>
                      <button className="btn btn-danger-sm" onClick={() => handleDelete(s._id)} title="মুছুন">
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>সর্বমোট</strong></td>
                  <td className="amount"><strong>{tk(totals.totalSales)}</strong></td>
                  <td className="amount income"><strong>{tk(totals.totalIncome)}</strong></td>
                  <td colSpan="2"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesPage;
