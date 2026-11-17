import React, { useState, useEffect, useCallback } from 'react';
import { addStock, getStock, deleteStock } from '../api/api';
import { broadcastSync, subscribeToSync, getLocalDateString } from '../utils/sync';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

// Robust parser that extracts cashPaid & ownAmount even if backend stripped fields
export const parseStockRecord = (s) => {
  const cashMatch = s.description?.match(/\[(?:ক্যাশ|cash):\s*৳?(\d+(?:\.\d+)?)\]/i);
  const ownMatch = s.description?.match(/\[(?:নিজের|own):\s*৳?(\d+(?:\.\d+)?)\]/i);

  const extractedCash = cashMatch ? Number(cashMatch[1]) : 0;
  const cashPaid = (s.cashPaid !== undefined && s.cashPaid !== null && Number(s.cashPaid) > 0)
    ? Number(s.cashPaid)
    : extractedCash;

  const total = Number(s.amount) || 0;
  const extractedOwn = ownMatch ? Number(ownMatch[1]) : 0;
  const ownPaid = (s.ownAmount !== undefined && s.ownAmount !== null && Number(s.ownAmount) > 0)
    ? Number(s.ownAmount)
    : (extractedOwn > 0 ? extractedOwn : Math.max(0, total - cashPaid));

  const cleanDesc = s.description
    ? s.description
        .replace(/\s*\[(?:ক্যাশ|cash):\s*৳?\d+(?:\.\d+)?\]/gi, '')
        .replace(/\s*\[(?:নিজের|own):\s*৳?\d+(?:\.\d+)?\]/gi, '')
        .trim()
    : '';

  return {
    ...s,
    amount: total,
    cashPaid,
    ownAmount: ownPaid,
    displayDescription: cleanDesc
  };
};

const StockPage = () => {
  const [form, setForm] = useState({ 
    amount: '',       // মালের মোট টাকা
    cashPaid: '',     // ক্যাশ বাক্স থেকে দেওয়া টাকা
    date: getLocalDateString(), 
    description: '' 
  });
  const [stocks, setStocks] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCashPaid, setTotalCashPaid] = useState(0);
  const [totalOwnPaid, setTotalOwnPaid] = useState(0);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [mobileTab, setMobileTab] = useState('form'); // 'form' | 'history'
  
  const now = new Date();
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  const fetchStocks = useCallback(async () => {
    try {
      const res = await getStock({ month: filterMonth, year: filterYear });
      const rawList = res.data.stocks || [];
      const parsedList = rawList.map(parseStockRecord);
      setStocks(parsedList);
      
      const malSum = parsedList.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);
      setTotalAmount(malSum);

      const cashSum = parsedList.reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);
      setTotalCashPaid(cashSum);

      const ownSum = parsedList.reduce((sum, s) => sum + (Number(s.ownAmount) || 0), 0);
      setTotalOwnPaid(ownSum);
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

  const numAmount = Math.max(0, Number(form.amount) || 0);
  const numCash = Math.max(0, Number(form.cashPaid) || 0);
  const calculatedOwn = Math.max(0, numAmount - numCash);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (numAmount <= 0 && numCash <= 0) {
      setError('মালের মোট টাকা অথবা ক্যাশ থেকে দেওয়া টাকার যেকোনো একটি লিখুন।');
      return;
    }

    setLoading(true);
    setError('');
    setMsg('');

    // If mal amount is not entered, treat cashPaid as the total amount
    const finalAmount = numAmount > 0 ? numAmount : numCash;
    const finalCash = numCash;
    const finalOwn = Math.max(0, finalAmount - finalCash);

    // Bulletproof persistence: embed tags so old backend/Mongoose builds never drop the data
    const cashTag = finalCash > 0 ? `[ক্যাশ: ৳${finalCash}]` : '';
    const ownTag = finalOwn > 0 ? `[নিজের: ৳${finalOwn}]` : '';
    const cleanDesc = form.description ? form.description.trim() : '';
    const tags = [cashTag, ownTag].filter(Boolean).join(' ');
    const descriptionWithTags = tags ? (cleanDesc ? `${cleanDesc} ${tags}` : tags) : cleanDesc;

    // --- Instant 0ms Optimistic UI Update ---
    const tempId = 'temp_' + Date.now();
    const optimisticItem = {
      _id: tempId,
      date: form.date,
      amount: finalAmount,
      cashPaid: finalCash,
      ownAmount: finalOwn,
      description: descriptionWithTags,
      displayDescription: cleanDesc
    };

    setStocks(prev => [optimisticItem, ...prev]);
    setTotalAmount(prev => prev + finalAmount);
    setTotalCashPaid(prev => prev + finalCash);
    setTotalOwnPaid(prev => prev + finalOwn);
    setMsg('✅ মাল ঢোকার তথ্য সেভ হয়েছে!');

    const submittedData = {
      amount: finalAmount,
      cashPaid: finalCash,
      ownAmount: finalOwn,
      date: form.date,
      description: descriptionWithTags
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
        const savedParsed = parseStockRecord(res.data.stock);
        setStocks(prev => prev.map(item => item._id === tempId ? savedParsed : item));
      }
      broadcastSync('stock_added');
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setStocks(prev => prev.filter(item => item._id !== tempId));
      setTotalAmount(prev => prev - finalAmount);
      setTotalCashPaid(prev => prev - finalCash);
      setTotalOwnPaid(prev => prev - finalOwn);
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
      setTotalOwnPaid(prev => Math.max(0, prev - (Number(target.ownAmount) || 0)));
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
    <div className="page-content" style={{ paddingBottom: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--stone-900)' }}>
            📦 মাল ঢোকার হিসাব
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--stone-500)', margin: '2px 0 0' }}>
            দোকানে মাল কেনার হিসাব, ক্যাশ বাক্স থেকে দেওয়া এবং নিজের টাকার হিসাব।
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
            💵 ক্যাশ থেকে: {tk(totalCashPaid)}
          </div>
          <div style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '5px 12px', borderRadius: '12px', fontSize: '13px', fontWeight: 700 }}>
            👤 নিজের টাকা: {tk(totalOwnPaid)}
          </div>
        </div>
      </div>

      {/* Mobile-Only Segmented Tab Switcher (< 768px) */}
      <div className="mobile-view-tabs only-mobile">
        <button
          type="button"
          className={`mobile-view-tab ${mobileTab === 'form' ? 'active' : ''}`}
          onClick={() => setMobileTab('form')}
        >
          ➕ নতুন মাল এন্ট্রি
        </button>
        <button
          type="button"
          className={`mobile-view-tab ${mobileTab === 'history' ? 'active' : ''}`}
          onClick={() => setMobileTab('history')}
        >
          📋 মালের হিস্টোরি ({stocks.length})
        </button>
      </div>

      {/* Layout: Split on Desktop, Tabbed on Mobile */}
      <div className="split-layout">
        {/* Left: Entry Form */}
        <div className={`form-card split-sticky ${mobileTab !== 'form' ? 'hide-on-mobile' : ''}`} style={{ margin: 0, padding: '20px' }}>
          <h3 style={{ fontSize: '16px', margin: '0 0 14px', paddingBottom: '10px' }}>
            ➕ নতুন মাল এন্ট্রি
          </h3>
          {msg && <div className="alert alert-success" style={{ padding: '8px 12px', fontSize: '13px' }}>{msg}</div>}
          {error && <div className="alert alert-error" style={{ padding: '8px 12px', fontSize: '13px' }}>⚠️ {error}</div>}
          
          <form onSubmit={handleSubmit}>
            {/* Input 1: মালের মোট টাকা */}
            <div className="form-group" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600 }}>
                মালের মোট পরিমাণ (টাকা) <span style={{ color: 'var(--stone-400)', fontWeight: 400 }}>(ঐচ্ছিক)</span>
              </label>
              <input
                id="stock-amount-input"
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
              <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                ক্যাশ বাক্স থেকে দেওয়া টাকা <span style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>(ক্যাশ থেকে বিয়োগ হবে)</span>
              </label>

              {/* Quick Click Option Buttons */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (form.amount && Number(form.amount) > 0) {
                      setForm({ ...form, cashPaid: form.amount });
                    } else {
                      document.getElementById('stock-amount-input')?.focus();
                    }
                  }}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: (form.amount && form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount))
                      ? '2px solid var(--emerald)'
                      : '1.5px solid var(--stone-200)',
                    background: (form.amount && form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount))
                      ? '#d1fae5'
                      : 'var(--stone-50)',
                    color: (form.amount && form.cashPaid !== '' && Number(form.cashPaid) === Number(form.amount))
                      ? '#065f46'
                      : 'var(--stone-700)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>💵 সম্পূর্ণ ক্যাশ</span>
                  {form.amount && Number(form.amount) > 0 ? (
                    <span style={{ fontSize: '11px', fontWeight: 700 }}>({tk(form.amount)})</span>
                  ) : ''}
                </button>

                <button
                  type="button"
                  onClick={() => setForm({ ...form, cashPaid: '0' })}
                  style={{
                    padding: '8px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: form.cashPaid === '0'
                      ? '2px solid var(--primary)'
                      : '1.5px solid var(--stone-200)',
                    background: form.cashPaid === '0'
                      ? 'var(--primary-light)'
                      : 'var(--stone-50)',
                    color: form.cashPaid === '0'
                      ? 'var(--primary)'
                      : 'var(--stone-700)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px'
                  }}
                >
                  <span>👤 নিজের টাকা (০৳ ক্যাশ)</span>
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

              {/* Dynamic Live Breakdown Card */}
              {(numAmount > 0 || numCash > 0) && (
                <div style={{ marginTop: '10px', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--stone-700)', marginBottom: '4px' }}>📊 হিসাবের লাইভ সারসংক্ষেপ:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: 'var(--stone-600)' }}>📦 মালের মোট বিল:</span>
                    <strong style={{ color: 'var(--stone-900)' }}>{tk(numAmount > 0 ? numAmount : numCash)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: '#b45309' }}>💵 ক্যাশ বাক্স থেকে কাটা হবে:</span>
                    <strong style={{ color: '#b45309' }}>{tk(numCash)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0' }}>
                    <span style={{ color: '#1d4ed8' }}>👤 নিজের/জমানো টাকা:</span>
                    <strong style={{ color: '#1d4ed8' }}>{tk(calculatedOwn)}</strong>
                  </div>
                </div>
              )}
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

            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '11px', width: '100%' }}>
              {loading ? 'সেভ হচ্ছে...' : '+ এন্ট্রি সেভ করুন'}
            </button>
          </form>
        </div>

        {/* Right: History View (Cards on mobile, Table on desktop) */}
        <div className={`compact-table-container ${mobileTab !== 'history' ? 'hide-on-mobile' : ''}`}>
          {stocks.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 20px' }}>📭 এই মাসে কোনো এন্ট্রি নেই।</div>
          ) : (
            <>
              {/* Mobile Card View (shown on <= 768px) */}
              <div className="only-mobile" style={{ padding: '12px' }}>
                {stocks.map(s => {
                  const cash = Number(s.cashPaid) || 0;
                  const own = Number(s.ownAmount) || 0;
                  return (
                    <div key={s._id} className="stock-mobile-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--stone-900)' }}>
                            {s.displayDescription || 'মাল ঢোকা'}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--stone-500)', marginTop: '2px' }}>
                            📅 {new Date(s.date).toLocaleDateString('bn-BD', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        </div>
                        <button className="btn btn-danger-sm" onClick={() => handleDelete(s._id)} title="মুছুন">
                          🗑️
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', background: 'var(--stone-50)', padding: '10px', borderRadius: '8px', textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: 'var(--stone-500)', fontWeight: 600 }}>মোট বিল</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--stone-900)', marginTop: '2px' }}>{tk(s.amount)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 600 }}>💵 ক্যাশ থেকে</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: cash > 0 ? '#b45309' : 'var(--stone-400)', marginTop: '2px' }}>
                            {cash > 0 ? tk(cash) : '—'}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>👤 নিজের টাকা</div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: own > 0 ? '#1d4ed8' : 'var(--stone-400)', marginTop: '2px' }}>
                            {own > 0 ? tk(own) : '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop / Tablet Full Data Table (shown on > 768px) */}
              <div className="hide-on-mobile">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>তারিখ</th>
                      <th>বিবরণ</th>
                      <th>মালের মোট টাকা</th>
                      <th>ক্যাশ থেকে দেওয়া</th>
                      <th>নিজের টাকা</th>
                      <th style={{ textAlign: 'center' }}>অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stocks.map(s => {
                      const cash = Number(s.cashPaid) || 0;
                      const own = Number(s.ownAmount) || 0;
                      return (
                        <tr key={s._id}>
                          <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                          <td style={{ fontWeight: 600, color: 'var(--stone-800)' }}>
                            {s.displayDescription || '—'}
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
                          <td>
                            {own > 0 ? (
                              <span style={{ color: '#1d4ed8', fontWeight: 700 }}>
                                👤 {tk(own)}
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
                      <td style={{ color: '#1d4ed8', fontWeight: 700 }}>
                        <strong>{totalOwnPaid > 0 ? tk(totalOwnPaid) : '—'}</strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockPage;
