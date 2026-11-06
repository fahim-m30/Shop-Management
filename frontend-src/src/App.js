import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import StockPage from './pages/StockPage';
import SalesPage from './pages/SalesPage';
import Navbar from './components/Navbar';
import InstallPwaBanner from './components/InstallPwaBanner';
import './App.css';

const AppContent = () => {
  const { user, loading } = useAuth();
  const [authMode, setAuthMode] = useState('login');
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p style={{ fontWeight: 600, fontSize: '16px', color: 'var(--stone-800)' }}>লোড হচ্ছে...</p>
        <p style={{ fontSize: '13px', color: 'var(--stone-500)', maxWidth: '300px', textAlign: 'center', marginTop: '6px', lineHeight: '1.4' }}>
          সার্ভার প্রস্তুত হচ্ছে, অনুগ্রহ করে কয়েক সেকেন্ড অপেক্ষা করুন...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <InstallPwaBanner />
        {authMode === 'login' ? (
          <LoginPage onSwitch={() => setAuthMode('register')} />
        ) : (
          <RegisterPage onSwitch={() => setAuthMode('login')} />
        )}
      </>
    );
  }

  return (
    <div className="app-layout">
      <InstallPwaBanner />
      <Navbar activePage={activePage} onNavigate={setActivePage} />
      <main className="main-content">
        {activePage === 'dashboard' && <DashboardPage />}
        {activePage === 'stock' && <StockPage />}
        {activePage === 'sales' && <SalesPage />}
      </main>
      <footer className="app-footer">
        <p>© {new Date().getFullYear()} দোকান ম্যানেজমেন্ট সিস্টেম</p>
      </footer>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
