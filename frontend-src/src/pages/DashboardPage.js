import React, { useState, useEffect, useCallback } from 'react';
import { getDashboard, getStock } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { subscribeToSync, getLocalDateString } from '../utils/sync';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('shop_cached_dashboard');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(!data);
  const [activeTab, setActiveTab] = useState('today'); // 'today', 'lastDay', 'monthly', 'allTime', 'compare'
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [lastSyncTime, setLastSyncTime] = useState(new Date());

  const fetchDashboard = useCallback(async (isSilent = false) => {
    if (!data && !isSilent) setLoading(true);
    try {
      const [dashRes, stockRes] = await Promise.all([
        getDashboard({ month: selectedMonth, year: selectedYear }),
        getStock({ month: selectedMonth, year: selectedYear }).catch(() => null)
      ]);

      const dData = dashRes.data || {};
      const stockList = stockRes?.data?.stocks || [];

      // Safe retail closing active date string
      const activeDateStr = getLocalDateString();

      // Find all stocks for today's active business date and sum cash paid
      const todayCashSpent = stockList
        .filter(s => s.date && s.date.startsWith(activeDateStr))
        .reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0);

      // Actual mal entered today (excluding pure cash drawer payments)
      const todayMalEntered = stockList
        .filter(s => s.date && s.date.startsWith(activeDateStr) && !(s.cashPaid > 0 && s.amount === s.cashPaid && (!s.description || s.description.includes('ক্যাশ'))))
        .reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

      const lastDateStr = dData?.lastDay?.date ? dData.lastDay.date.split('T')[0] : '';
      const lastDayCashSpent = lastDateStr
        ? stockList.filter(s => s.date && s.date.startsWith(lastDateStr)).reduce((sum, s) => sum + (Number(s.cashPaid) || 0), 0)
        : todayCashSpent;

      // Mathematically guaranteed remaining cash: Sales - Cash given for Stock
      if (dData.today) {
        if (todayMalEntered > 0) dData.today.totalStock = todayMalEntered;
        dData.today.totalCashStock = todayCashSpent;
        dData.today.remainingCash = Math.max(0, (Number(dData.today.totalSales) || 0) - todayCashSpent);
      }
      if (dData.lastDay) {
        dData.lastDay.totalCashStock = lastDayCashSpent;
        dData.lastDay.remainingCash = Math.max(0, (Number(dData.lastDay.totalSales) || 0) - lastDayCashSpent);
      }

      setData(dData);
      localStorage.setItem('shop_cached_dashboard', JSON.stringify(dData));
      setLastSyncTime(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, selectedYear]);

  // Real-time synchronization
  useEffect(() => {
    fetchDashboard(true);
    const unsubscribe = subscribeToSync(() => fetchDashboard(true), 800);
    return () => unsubscribe();
  }, [fetchDashboard]);

  const tk = (amount) => `৳${Number(amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}`;

  const formatDateBn = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  if (loading && !data) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--stone-800)' }}>হিসাব লোড হচ্ছে...</p>
      <p style={{ fontSize: '13px', color: 'var(--stone-500)', maxWidth: '320px', textAlign: 'center', lineHeight: '1.5' }}>
        ⏳ ক্লাউড সার্ভার প্রস্তুত হচ্ছে... প্রথমবার কিছুক্ষণ সময় লাগতে পারে, দয়া করে অপেক্ষা করুন।
      </p>
    </div>
  );

  // Active metrics depending on selected tab
  let heroTitle = '🌅 আজকের হিসাব';
  let heroSubtitle = formatDateBn(new Date());
  let currentStock = data?.today?.totalStock || 0;
  let currentSales = data?.today?.totalSales || 0;
  let currentIncome = data?.today?.totalIncome || 0;
  let currentCash = data?.today?.remainingCash || 0;
  let isDaily = true;

  if (activeTab === 'lastDay' && data?.lastDay) {
    heroTitle = '⏱️ সর্বশেষ সক্রিয় দিনের হিসাব';
    heroSubtitle = data.lastDay.date ? formatDateBn(data.lastDay.date) : 'পূর্ববর্তী লেনদেন';
    currentStock = data.lastDay.totalStock || 0;
    currentSales = data.lastDay.totalSales || 0;
    currentIncome = data.lastDay.totalIncome || 0;
    currentCash = data.lastDay.remainingCash || 0;
    isDaily = true;
  } else if (activeTab === 'monthly') {
    heroTitle = `📅 ${MONTHS[selectedMonth - 1]} ${selectedYear} — মাসিক হিসাব`;
    heroSubtitle = 'নির্বাচিত মাসের হিসাব';
    currentStock = data?.monthly?.totalStock || 0;
    currentSales = data?.monthly?.totalSales || 0;
    currentIncome = data?.monthly?.totalIncome || 0;
    isDaily = false;
  } else if (activeTab === 'allTime') {
    heroTitle = '🏆 সর্বমোট হিসাব (সব সময়)';
    heroSubtitle = 'দোকানের শুরু থেকে আজ পর্যন্ত';
    currentStock = data?.allTime?.totalStock || 0;
    currentSales = data?.allTime?.totalSales || 0;
    currentIncome = data?.allTime?.totalIncome || 0;
    isDaily = false;
  }

  return (
    <div className="page-content" style={{ paddingBottom: '10px' }}>
      {/* Compact Header with Live Badge & Quick Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--stone-900)' }}>
            📊 ড্যাশবোর্ড
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--stone-500)', margin: '2px 0 0' }}>
            {user?.shopName} — {user?.name} | <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>🟢 লাইভ আপডেট: {lastSyncTime.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
          </p>
        </div>

        {/* Compact Month/Year Selector */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={selectedMonth} 
            onChange={e => setSelectedMonth(Number(e.target.value))}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--stone-200)', background: 'var(--white)', fontWeight: 600 }}
          >
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(Number(e.target.value))}
            style={{ padding: '6px 10px', fontSize: '13px', borderRadius: '8px', border: '1px solid var(--stone-200)', background: 'var(--white)', fontWeight: 600 }}
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Zero-Scroll Period Switcher Tabs */}
      <div className="period-switcher">
        <button 
          className={`period-btn ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          🌅 আজকের হিসাব
        </button>
        {data?.lastDay && (
          <button 
            className={`period-btn ${activeTab === 'lastDay' ? 'active' : ''}`}
            onClick={() => setActiveTab('lastDay')}
          >
            ⏱️ শেষ সক্রিয় দিন
          </button>
        )}
        <button 
          className={`period-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          📅 এই মাসের হিসাব
        </button>
        <button 
          className={`period-btn ${activeTab === 'allTime' ? 'active' : ''}`}
          onClick={() => setActiveTab('allTime')}
        >
          🏆 সর্বমোট হিসাব
        </button>
        <button 
          className={`period-btn ${activeTab === 'compare' ? 'active' : ''}`}
          onClick={() => setActiveTab('compare')}
        >
          📋 ৬ মাসের তুলনা
        </button>
      </div>

      {activeTab !== 'compare' ? (
        <>
          {/* Header row for active tab */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--stone-700)' }}>
              {heroTitle}
            </span>
            <span style={{ fontSize: '12px', background: 'var(--stone-100)', padding: '2px 8px', borderRadius: '12px', color: 'var(--stone-600)', fontWeight: 600 }}>
              {heroSubtitle}
            </span>
          </div>

          {/* Dedicated Daily Cash Drawer Box (শুধুমাত্র আজকের বা শেষ সক্রিয় দিনের জন্য) */}
          {isDaily && (
            <div className="cash-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '28px' }}>💵</span>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#065f46' }}>
                    {activeTab === 'today' ? 'আজকের' : 'শেষ দিনের'} অবশিষ্ট ক্যাশ (Cash in Hand): {tk(currentCash)}
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: '3px' }}>
                    হিসাব: মোট বিক্রয় (<strong>{tk(currentSales)}</strong>) − ক্যাশ বাক্স থেকে মাল কেনা (<strong>{tk(activeTab === 'today' ? (data?.today?.totalCashStock || 0) : (data?.lastDay?.totalCashStock || 0))}</strong>)
                  </div>
                </div>
              </div>
              <div style={{ fontSize: '12px', background: '#d1fae5', color: '#065f46', padding: '5px 12px', borderRadius: '14px', fontWeight: 600, border: '1px solid #a7f3d0' }}>
                ℹ️ শুধুমাত্র {activeTab === 'today' ? 'আজকের' : 'ঐ'} দিনের হিসাব (পরদিন নতুন শুরু)
              </div>
            </div>
          )}

          {/* Hero Cards Grid (4 cards for daily with Cash in Hand, 3 cards for monthly/all-time) */}
          <div className="stats-grid" style={{ marginBottom: '14px' }}>
            <div className="stat-card stat-blue" style={{ padding: '16px' }}>
              <div className="stat-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>📦</div>
              <div className="stat-info">
                <p style={{ margin: 0, fontSize: '12px' }}>মাল ঢুকেছে</p>
                <h3 style={{ fontSize: '20px', marginTop: '2px' }}>{tk(currentStock)}</h3>
                {isDaily && (activeTab === 'today' ? (data?.today?.totalCashStock || 0) : (data?.lastDay?.totalCashStock || 0)) > 0 && (
                  <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
                    💵 ক্যাশ থেকে দেওয়া: {tk(activeTab === 'today' ? data?.today?.totalCashStock : data?.lastDay?.totalCashStock)}
                  </div>
                )}
              </div>
            </div>

            <div className="stat-card stat-green" style={{ padding: '16px' }}>
              <div className="stat-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>💰</div>
              <div className="stat-info">
                <p style={{ margin: 0, fontSize: '12px' }}>মোট বিক্রয়</p>
                <h3 style={{ fontSize: '20px', marginTop: '2px' }}>{tk(currentSales)}</h3>
              </div>
            </div>

            <div className="stat-card stat-orange" style={{ padding: '16px' }}>
              <div className="stat-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>📈</div>
              <div className="stat-info">
                <p style={{ margin: 0, fontSize: '12px' }}>মোট লাভ (১২%)</p>
                <h3 style={{ fontSize: '20px', marginTop: '2px' }}>{tk(currentIncome)}</h3>
              </div>
            </div>

            {isDaily && (
              <div className="stat-card stat-cash" style={{ padding: '16px' }}>
                <div className="stat-icon" style={{ width: '44px', height: '44px', fontSize: '22px' }}>💵</div>
                <div className="stat-info">
                  <p style={{ margin: 0, fontSize: '12px', color: '#065f46' }}>হাতে ক্যাশ (অবশিষ্ট)</p>
                  <h3 style={{ fontSize: '20px', marginTop: '2px', color: '#047857' }}>{tk(currentCash)}</h3>
                </div>
              </div>
            )}
          </div>

          {/* Zero-Scroll Executive Summary: All Periods in 1 Compact Card */}
          <div className="overview-card" style={{ marginTop: '0', padding: '12px 16px' }}>
            <div className="overview-card-header" style={{ marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--stone-800)' }}>
                ⚡ এক নজরে সব হিসাব (All Time & Live)
              </span>
              <span style={{ fontSize: '12px', color: 'var(--stone-500)', fontWeight: 500 }}>
                কোনো স্ক্রল ছাড়াই সম্পূর্ণ হিসাব
              </span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="overview-table">
                <thead>
                  <tr>
                    <th>সময়কাল</th>
                    <th>📦 মাল ঢুকেছে</th>
                    <th>💰 বিক্রয়</th>
                    <th>📈 লাভ / আয় (১২%)</th>
                    <th>💵 হাতে ক্যাশ</th>
                  </tr>
                </thead>
                <tbody>
                  <tr 
                    className={activeTab === 'today' ? 'active-row' : ''} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab('today')}
                  >
                    <td>🌅 আজকের হিসাব</td>
                    <td>{tk(data?.today?.totalStock)}</td>
                    <td>{tk(data?.today?.totalSales)}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tk(data?.today?.totalIncome)}</td>
                    <td style={{ color: '#059669', fontWeight: 700 }}>{tk(data?.today?.remainingCash)}</td>
                  </tr>

                  {data?.lastDay && (
                    <tr 
                      className={activeTab === 'lastDay' ? 'active-row' : ''} 
                      style={{ cursor: 'pointer' }}
                      onClick={() => setActiveTab('lastDay')}
                    >
                      <td>⏱️ শেষ সক্রিয় দিন ({formatDateBn(data.lastDay.date)})</td>
                      <td>{tk(data.lastDay.totalStock)}</td>
                      <td>{tk(data.lastDay.totalSales)}</td>
                      <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tk(data.lastDay.totalIncome)}</td>
                      <td style={{ color: '#059669', fontWeight: 700 }}>{tk(data.lastDay.remainingCash)}</td>
                    </tr>
                  )}

                  <tr 
                    className={activeTab === 'monthly' ? 'active-row' : ''} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab('monthly')}
                  >
                    <td>📅 চলতি মাস ({MONTHS[selectedMonth - 1]})</td>
                    <td>{tk(data?.monthly?.totalStock)}</td>
                    <td>{tk(data?.monthly?.totalSales)}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tk(data?.monthly?.totalIncome)}</td>
                    <td style={{ color: 'var(--stone-400)', fontSize: '12px' }}>— (শুধু দৈনিক)</td>
                  </tr>

                  <tr 
                    className={activeTab === 'allTime' ? 'active-row' : ''} 
                    style={{ cursor: 'pointer' }}
                    onClick={() => setActiveTab('allTime')}
                  >
                    <td>🏆 সর্বমোট হিসাব</td>
                    <td>{tk(data?.allTime?.totalStock)}</td>
                    <td>{tk(data?.allTime?.totalSales)}</td>
                    <td style={{ color: 'var(--emerald)', fontWeight: 700 }}>{tk(data?.allTime?.totalIncome)}</td>
                    <td style={{ color: 'var(--stone-400)', fontSize: '12px' }}>— (শুধু দৈনিক)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* 6 Month Comparison View */
        <div className="overview-card" style={{ marginTop: '0', padding: '14px 18px' }}>
          <div className="overview-card-header">
            <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--stone-800)' }}>
              📋 বিগত ৬ মাসের তুলনামূলক রেকর্ড
            </span>
            <button 
              className="btn-refresh"
              onClick={() => setActiveTab('today')}
            >
              ⬅️ আজকের হিসাবে ফিরুন
            </button>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 250px)' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>মাস</th>
                  <th>মাল ঢুকেছে</th>
                  <th>বিক্রয়</th>
                  <th>আয় (১২%)</th>
                </tr>
              </thead>
              <tbody>
                {data?.monthlyBreakdown?.map((row, i) => (
                  <tr key={i} className={row.month === selectedMonth && row.year === selectedYear ? 'highlight-row' : ''}>
                    <td>{MONTHS[row.month - 1]} {row.year}</td>
                    <td className="amount">{tk(row.totalStock)}</td>
                    <td className="amount">{tk(row.totalSales)}</td>
                    <td className="amount income">{tk(row.totalIncome)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
