import React, { useState, useEffect } from 'react';

const InstallPwaBanner = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if running as standalone app already
    const isApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isApp);

    // Check if iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Android/Chrome install prompt listener
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  if (isStandalone || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  return (
    <>
      <div style={{
        background: 'linear-gradient(90deg, #1e40af, #2563eb)',
        color: '#ffffff',
        padding: '10px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '10px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        zIndex: 1000,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>📲</span>
          <span>
            {isIOS 
              ? 'আইফোনে অ্যাপ হিসেবে হোম স্ক্রিনে রাখুন!'
              : 'অ্যাপ হিসেবে আপনার ফোনে ইনস্টল করুন!'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: '#facc15',
              color: '#1e3a8a',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 14px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            {isIOS ? 'কীভাবে করবেন?' : 'ইন্সটল করুন'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 6px'
            }}
            title="বন্ধ করুন"
          >
            ✕
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            maxWidth: '360px',
            width: '100%',
            textAlign: 'center',
            color: '#1f2937'
          }}>
            <div style={{ fontSize: '40px', marginBottom: '12px' }}>🍏</div>
            <h3 style={{ margin: '0 0 10px', fontSize: '18px' }}>আইফোনে (Apple) অ্যাপ ইনস্টল:</h3>
            <ol style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.8', paddingLeft: '20px' }}>
              <li>Safari ব্রাউজারের নিচে <strong>Share বাটনে (📤)</strong> চাপুন।</li>
              <li>নিচে স্ক্রল করে <strong>'Add to Home Screen' (➕)</strong> বেছে নিন।</li>
              <li>উপরে ডানে <strong>'Add'</strong> চাপুন।</li>
            </ol>
            <p style={{ fontSize: '13px', color: '#16a34a', fontWeight: '600' }}>
              ব্যাস! আপনার আইফোনের স্ক্রিনে দোকান ম্যানেজার অ্যাপ তৈরি হয়ে যাবে।
            </p>
            <button
              onClick={() => setShowIOSGuide(false)}
              style={{
                marginTop: '16px',
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 24px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              বুঝেছি
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallPwaBanner;
