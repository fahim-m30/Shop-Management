import React, { useState, useEffect, useCallback } from 'react';
import { addStock, getStock, deleteStock } from '../api/api';
import { broadcastSync, subscribeToSync, getLocalDateString } from '../utils/sync';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const StockPage = () => {
  const [form, setForm] = useState({ 
    amount: '',       // মালের মোট টাকা
    cashPaid: '',     // ক্যাশ থেকে দেওয়া টাকা
    date: getLocalDateString(), 
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
      const stockList = res.data.stocks || [];
      setStocks(stockList);
      setTotalAmount(res.data.totalAmount || stockList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0));
      // Calculate total cash paid directly from the loaded stock records
      const cashSum = stockList.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
      setTotalCashPaid(cashSum);
    } catch (err) {
      console.error(err);
    }
  }, [filterMonth, filterYear]);

  // Sub-second real-time sync (< 1s)
  useEffect(() => {
    fetchStocks();
    const unsubscribe = subscribeToSync(fetchStocks, 800);
    return () => unsubscribe();
  }, [fetchStocks]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numAmount = Math.max(0, Number(form.amount) || 0);
    const numCash = Math.max(0, Number(form.cashPaid) || 0);

    if (numAmount <= 0 && numCash <= 0) {
      setError('মালের টাকা অথবা ক্যাশ থেকে দেওয়া টাকার যেকোনো একটি লিখুন।');
      return;
    }

    setLoading(true);
    setError('');
    setMsg('');

    const finalAmount = numAmount;
    const finalCash = numCash;

    // --- Instant 0ms Optimistic UI Update ---
    const tempId = 'temp_' + Date.now();
    const optimisticItem = {
      _id: tempId,
      date: form.date,
      amount: finalAmount,
      cashPaid: finalCash,
      description: form.description
    };

    setStocks(prev => [optimisticItem, ...prev]);
    setTotalAmount(prev => prev + finalAmount);
    setTotalCashPaid(prev => prev + finalCash);
    setMsg('✅ মাল ঢোকার তথ্য সেভ হয়েছে!');

    const submittedData = {
      amount: finalAmount,
      cashPaid: finalCash,
      date: form.date,
      description: form.description
    };

    setForm({ 
      amount: '', 
      cashPaid: '', 
      date: getLocalDateString(), 
      description: '' 
    });

    try {
      const res = await addStock(submittedData);
      if (res.data?.stock) {
        setStocks(prev => prev.map(item => item._id === tempId ? res.data.stock : item));
      }
      broadcastSync('stock_added');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setStocks(prev => prev.filter(item => item._id !== tempId));
      setTotalAmount(prev => prev - finalAmount);
      setTotalCashPaid(prev => prev - finalCash);
      setError(err.response?.data?.message || 'সেভ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('এই এন্ট্রি মুছে ফেলতে চান?')) return;
    const target = stocks.find(s => s._id === id);
    if (target) {
      setStocks(prev => prev.filter(s => s._id !== id));
      setTotalAmount(prev => Math.max(0, prev - (Number(target.amount) || 0)));
      setTotalCashPaid(prev => Math.max(0, prev - (Number(target.cashPaid) || 0)));
    }

    try {
      await deleteStock(id);
      broadcastSync('stock_deleted');
    } catch (err) {
      fetchStocks();
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
            দোকানে মাল কেনার হিসাব এবং ক্যাশ থেকে দেওয়া টাকার রেকর্ড।
          </p>
        </div>

        {/* Filter controls & Summary Badges */}
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
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: '1px solid var(--primary-border)', padding: '5px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            📦 মোট মাল: {tk(totalAmount)}
          </div>
          <div style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a', padding: '5px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            💵 ক্যাশ থেকে দেওয়া: {tk(totalCashPaid)}
          </div>
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
            {/* Input 1: মালের মোট টাকা */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>
                মালের মোট পরিমাণ (টাকা)
              </label>
              <input
                type="number"
                placeholder="যেমন: 2605"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                min="0"
                style={{ padding: '10px 14px' }}
              />
            </div>

            {/* Input 2: ক্যাশ বাক্স থেকে দেওয়া টাকা */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, margin: 0 }}>
                  ক্যাশ বাক্স থেকে দেওয়া টাকা <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>(ক্যাশ থেকে বিয়োগ হবে)</span>
                </label>
              </div>

              {/* Quick Click Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (form.amount && Number(form.amount) > 0) {
                      setForm({ ...form, cashPaid: form.amount });
                    }
                  }}
                  style={{
                    padding: '7px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? '1.5px solid var(--emerald)' : '1px solid var(--stone-200)',
                    background: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? 'var(--emerald-light)' : 'var(--stone-50)',
                    color: form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount) && Number(form.amount) > 0 ? 'var(--emerald)' : 'var(--stone-600)',
                    cursor: 'pointer'
                  }}
                >
                  💵 সম্পূর্ণ ক্যাশ
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, cashPaid: '0' })}
                  style={{
                    padding: '7px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: form.cashPaid === '0' ? '1.5px solid var(--primary)' : '1px solid var(--stone-200)',
                    background: form.cashPaid === '0' ? 'var(--primary-light)' : 'var(--stone-50)',
                    color: form.cashPaid === '0' ? 'var(--primary)' : 'var(--stone-600)',
                    cursor: 'pointer'
                  }}
                >
                  ❌ ক্যাশ দেইনি (০৳)
                </button>
              </div>

              <input
                type="number"
                placeholder="বা নির্দিষ্ট ক্যাশের টাকা লিখুন (যেমন: 1205)"
                value={form.cashPaid}
                onChange={e => setForm({ ...form, cashPaid: e.target.value })}
                min="0"
                style={{ padding: '10px 14px' }}
              />
              <span style={{ fontSize: '11px', color: 'var(--stone-500)', marginTop: '4px', display: 'block', lineHeight: '1.4' }}>
                💡 এই মালের জন্য ক্যাশ বাক্স থেকে কত টাকা দিয়েছেন? শুধু সেই টাকাটাই ক্যাশ থেকে বিয়োগ হবে (মাল ঢোকার হিসাব আলাদা বাড়বে না)। ক্যাশ থেকে না দিলে ০ রাখুন।
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px' }}>বিবরণ (কোম্পানি বা মালের নাম)</label>
              <input
                type="text"
                placeholder="যেমন: uni liver, pran, তেল, ডাল"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                style={{ padding: '10px 14px' }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '12px' }}>তারিখ</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm({ ...form, date: e.target.value })}
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
                  <th>বিবরণ</th>
                  <th>মালের মোট টাকা</th>
                  <th>ক্যাশ থেকে দেওয়া</th>
                  <th style={{ textAlign: 'center' }}>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map(s => {
                  const cash = Number(s.cashPaid) || 0;
                  return (
                    <tr key={s._id}>
                      <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                      <td style={{ fontWeight: 600, color: 'var(--stone-800)' }}>
                        {s.description || '—'}
                      </td>
                      <td className="amount" style={{ fontWeight: 700, color: s.amount > 0 ? 'var(--primary)' : 'var(--stone-400)' }}>
                        {s.amount > 0 ? tk(s.amount) : '—'}
                      </td>
                      <td>
                        {cash > 0 ? (
                          <span style={{ color: '#b45309', fontWeight: 700 }}>
                            💵 {tk(cash)}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--stone-400)', fontSize: '12px' }}>
                            —
                          </span>
                        )}
                      </td>
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
                  <td colSpan="2"><strong>সর্বমোট</strong></td>
                  <td className="amount" style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    <strong>{tk(totalAmount)}</strong>
                  </td>
                  <td style={{ color: '#b45309', fontWeight: 700 }}>
                    <strong>{totalCashPaid > 0 ? tk(totalCashPaid) : '—'}</strong>
                  </td>
                  <td></td>
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
