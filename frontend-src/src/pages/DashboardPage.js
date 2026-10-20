import React, { useState, useEffect, useCallback } from 'react';
import { getDashboard } from '../api/api';
import { useAuth } from '../context/AuthContext';

const MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল',
  'মে', 'জুন', 'জুলাই', 'আগস্ট',
  'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
];

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDashboard({ month: selectedMonth, year: selectedYear });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const tk = (amount) => `৳${Number(amount || 0).toLocaleString('bn-BD', { minimumFractionDigits: 2 })}`;

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 3; y--) years.push(y);

  if (loading) return (
    <div className="loading-screen">
      <div className="spinner"></div>
      <p>লোড হচ্ছে...</p>
    </div>
  );

  return (
    <div className="page-content">
      <div className="page-header">
        <h2>📊 ড্যাশবোর্ড</h2>
        <p>{user?.shopName} — স্বাগতম, {user?.name}!</p>
      </div>

      {/* Month/Year Filter */}
      <div className="filter-bar">
        <div className="filter-group">
          <label>মাস:</label>
          <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
            {MONTHS.map((m, i) => (
              <option key={i + 1} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>বছর:</label>
          <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Today's Stats */}
      <h3 className="section-title">🌅 আজকের হিসাব</h3>
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <p>আজ মাল ঢুকেছে</p>
            <h3>{tk(data?.today?.totalStock)}</h3>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <p>আজ বিক্রয়</p>
            <h3>{tk(data?.today?.totalSales)}</h3>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <p>আজ আয় (১২%)</p>
            <h3>{tk(data?.today?.totalIncome)}</h3>
          </div>
        </div>
      </div>

      {/* Monthly Stats */}
      <h3 className="section-title">📅 {MONTHS[selectedMonth - 1]} {selectedYear} — মাসিক হিসাব</h3>
      <div className="stats-grid">
        <div className="stat-card stat-blue">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <p>মোট মাল ঢুকেছে</p>
            <h3>{tk(data?.monthly?.totalStock)}</h3>
          </div>
        </div>
        <div className="stat-card stat-green">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <p>মোট বিক্রয়</p>
            <h3>{tk(data?.monthly?.totalSales)}</h3>
          </div>
        </div>
        <div className="stat-card stat-orange">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <p>মোট আয় (১২%)</p>
            <h3>{tk(data?.monthly?.totalIncome)}</h3>
          </div>
        </div>
      </div>

      {/* All Time Stats */}
      <h3 className="section-title">🏆 সর্বমোট হিসাব (সব সময়)</h3>
      <div className="stats-grid">
        <div className="stat-card stat-purple">
          <div className="stat-icon">📦</div>
          <div className="stat-info">
            <p>সর্বমোট মাল</p>
            <h3>{tk(data?.allTime?.totalStock)}</h3>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <p>সর্বমোট বিক্রয়</p>
            <h3>{tk(data?.allTime?.totalSales)}</h3>
          </div>
        </div>
        <div className="stat-card stat-purple">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <p>সর্বমোট আয় (১২%)</p>
            <h3>{tk(data?.allTime?.totalIncome)}</h3>
          </div>
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <h3 className="section-title">📋 গত ৬ মাসের তুলনা</h3>
      <div className="table-wrapper">
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
  );
};

export default DashboardPage;
