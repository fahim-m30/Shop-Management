import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ activePage, onNavigate }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🏪</span>
        <span className="brand-name">{user?.shopName || 'দোকান ম্যানেজার'}</span>
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
        <span className="user-name">👤 {user?.name}</span>
        <button className="btn btn-logout" onClick={logout}>লগআউট</button>
      </div>
    </nav>
  );
};

export default Navbar;
