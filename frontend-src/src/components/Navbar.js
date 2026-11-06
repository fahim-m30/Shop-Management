import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const handleManualSync = () => {
    setRefreshing(true);
    window.dispatchEvent(new CustomEvent('shop-sync'));
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🏪</span>
        <span className="brand-name">{user?.shopName || 'দোকান ম্যানেজার'}</span>
        <span className="live-badge" title="রিয়েল-টাইম লাইভ সিঙ্ক সক্রিয়">
          <span className="live-dot"></span> লাইভ
        </span>
      </div>

      <div className="navbar-links">
        <button
          className={`nav-link ${activePage === 'dashboard' ? 'active' : ''}`}
          onClick={() => onNavigate('dashboard')}
        >
          📊 ড্যাশবোর্ড
        </button>
        <button
          className={`nav-link ${activePage === 'stock' ? 'active' : ''}`}
          onClick={() => onNavigate('stock')}
        >
          📦 মাল ঢোকা
        </button>
        <button
          className={`nav-link ${activePage === 'sales' ? 'active' : ''}`}
          onClick={() => onNavigate('sales')}
        >
          💰 বিক্রয়
        </button>
      </div>

      <div className="navbar-user">
        <button 
          className="btn-refresh" 
          onClick={handleManualSync} 
          title="তাৎক্ষণিক ডেটা রিফ্রেশ করুন"
        >
          <span className={refreshing ? 'spin-icon' : ''}>🔄</span>
          <span>রিফ্রেশ</span>
        </button>
        <span className="user-name">👤 {user?.name}</span>
        <button className="btn btn-logout" onClick={logout}>লগআউট</button>
      </div>
    </nav>
  );
};

export default Navbar;
