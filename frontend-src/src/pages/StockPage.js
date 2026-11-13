import React, { useState, useEffect, useCallback } from 'react';
import { addStock, getStock, deleteStock } from '../api/api';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const StockPage = () => {
  const [form, setForm] = useState({ 
    amount: '', 
    cashPaid: '', 
    date: new Date().toISOString().split('T')[0], 
    description: '' 
  });
  const [stocks, setStocks] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCashPaid, setTotalCashPaid] = useState(0);
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
      setTotalCashPaid(res.data.totalCashPaid || 0);
    } catch (err) {
      console.error(err);
    }
  }, [filterMonth, filterYear]);

  // Real-time synchronization
  useEffect(() => {
    fetchStocks();

    const handleSync = () => fetchStocks();
    window.addEventListener('shop-sync', handleSync);
    window.addEventListener('focus', handleSync);

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchStocks();
      }
    }, 6000);

    return () => {
      window.removeEventListener('shop-sync', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(interval);
    };
  }, [fetchStocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Number(form.amount) || 0;
    const numCash = Number(form.cashPaid) || 0;

    if (numAmount <= 0 && numCash <= 0) {
      setError('মালের টাকা অথবা ক্যাশ থেকে নেওয়া টাকার যেকোনো একটি পরিমাণ লিখুন।');
      return;
    }

    setLoading(true);
    setError('');
    setMsg('');
    try {
      // If amount is left blank but cash is given, mal total is at least that cash amount
      const finalAmount = numAmount > 0 ? numAmount : numCash;
      const finalCash = numCash;

      await addStock({ 
        amount: finalAmount, 
        cashPaid: finalCash,
        date: form.date, 
        description: form.description 
      });

      setMsg('✅ মাল ঢোকার তথ্য সেভ হয়েছে!');
      setForm({ 
        amount: '', 
        cashPaid: '', 
        date: new Date().toISOString().split('T')[0], 
        description: '' 
      });
      fetchStocks();
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
    if (!window.confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    try {
      await deleteStock(id);
      fetchStocks();
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
            📦 মাল ঢোকার হিসাব
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--stone-500)', margin: '2px 0 0' }}>
            নিজে থেকে বা ক্যাশের টাকা নিয়ে মাল কেনার হিসাব এন্ট্রি করুন।
          </p>
        </div>

        {/* Filter controls */}
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
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '5px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            মোট মাল: {tk(totalAmount)}
          </div>
          {totalCashPaid > 0 && (
            <div style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '5px 10px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
              ক্যাশ থেকে দেওয়া: {tk(totalCashPaid)}
            </div>
          )}
        </div>
      </div>

      {/* Split-Layout: Zero Window Scroll */}
      <div className="split-layout">
        {/* Left: Sticky Compact Form */}
        <div className="form-card split-sticky" style={{ margin: 0, padding: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 14px', paddingBottom: '10px' }}>
            ➕ নতুন মাল এন্ট্রি
          </h3>
          {msg && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '13px' }}>{msg}</div>}
          {error && <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '13px' }}>⚠️ {error}</div>}
          
          <form onSubmit={handleSubmit}>
            {/* Stock Total Amount */}
            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>মালের মোট পরিমাণ (টাকা)</span>
                <span style={{ color: 'var(--stone-400)', fontWeight: 400, fontSize: '11px' }}>ঐচ্ছিক</span>
              </label>
              <input
                type="number"
                placeholder="যেমন: 5000 (খালি রাখলে ক্যাশ টাকা বসবে)"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                min="0"
                style={{ padding: '10px 14px' }}
              />
            </div>

            {/* 1-Click Fast Options: "নিজে থেকে" vs "ক্যাশ থেকে" */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span>ক্যাশ বাক্স থেকে দেওয়া টাকা</span>
                <span style={{ color: 'var(--stone-400)', fontWeight: 400, fontSize: '11px' }}>ঐচ্ছিক</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                {/* Option 1: নিজে থেকে (০৳ ক্যাশ) */}
                <button
                  type="button"
                  onClick={() => setForm({ ...form, cashPaid: '' })}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: form.cashPaid === '' || Number(form.cashPaid) === 0 ? '1.5px solid var(--primary)' : '1px solid var(--stone-200)',
                    background: form.cashPaid === '' || Number(form.cashPaid) === 0 ? 'var(--primary-light)' : 'var(--stone-50)',
                    color: form.cashPaid === '' || Number(form.cashPaid) === 0 ? 'var(--primary)' : 'var(--stone-600)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>👤 নিজে থেকে (০৳)</span>
                </button>

                {/* Option 2: সম্পূর্ণ টাকা ক্যাশ থেকে */}
                <button
                  type="button"
                  onClick={() => {
                    if (form.amount && Number(form.amount) > 0) {
                      setForm({ ...form, cashPaid: form.amount });
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? '1.5px solid var(--emerald)' : '1px solid var(--stone-200)',
                    background: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? 'var(--emerald-light)' : 'var(--stone-50)',
                    color: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? 'var(--emerald)' : 'var(--stone-600)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>💵 সম্পূর্ণ ক্যাশ {form.amount ? `(৳${form.amount})` : ''}</span>
                </button>
              </div>

              {/* Custom Cash Input */}
              <input
                type="number"
                placeholder="বা ক্যাশের পরিমাণ লিখুন (যেমন: 1205)"
                value={form.cashPaid}
                onChange={e => setForm({ ...form, cashPaid: e.target.value })}
                min="0"
                style={{ padding: '10px 14px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--stone-500)', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                💡 যেকোনো একটি বা দুটিই একসাথে দিতে পারেন: শুধু ক্যাশ দিলে ক্যাশ থেকে কাটা হবে, শুধু মালের টাকা দিলে নিজে থেকে হিসাব হবে।
              </span>
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
                placeholder="যেমন: চাল, ডাল, তেল"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ padding: '10px 14px' }}
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '11px' }}>
              {loading ? 'সেভ হচ্ছে...' : '+ এন্ট্রি সেভ করুন'}
            </button>
          </form>
        </div>

        {/* Right: Scrollable Records Table */}
        <div className="compact-table-container">
          {stocks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>📭 এই মাসে কোনো এন্ট্রি নেই।</div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>মালের টাকা</th>
                  <th>টাকার উৎস</th>
                  <th>বিবরণ</th>
                  <th style={{ textAlign: 'center' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => {
                  const paid = Number(s.cashPaid) || 0;
                  return (
                    <tr key={s._id}>
                      <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                      <td className="amount">{tk(s.amount)}</td>
                      <td>
                        {paid > 0 ? (
                          <span style={{ color: '#b45309', fontWeight: 600 }}>
                            💵 ক্যাশ: {tk(paid)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--stone-500)', fontSize: '12px', background: 'var(--stone-100)', padding: '2px 8px', borderRadius: '10px' }}>
                            👤 নিজে থেকে
                          </span>
                        )}
                      </td>
                      <td>{s.description || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button className="btn btn-danger-sm" onClick={() => handleDelete(s._id)} title="মুছুন">
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="total-row">
                  <td><strong>সর্বমোট</strong></td>
                  <td className="amount"><strong>{tk(totalAmount)}</strong></td>
                  <td style={{ color: '#b45309', fontWeight: 700 }}>
                    {totalCashPaid > 0 ? tk(totalCashPaid) : '—'}
                  </td>
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

export default StockPage;
