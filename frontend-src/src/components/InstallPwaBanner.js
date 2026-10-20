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
        background: 'linear-gradient(90deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        color: '#ffffff',
        padding: '11px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.15)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '20px' }}>📲</span>
          <span style={{ fontWeight: '600', letterSpacing: '-0.2px' }}>
            {isIOS 
              ? 'আইফোনে অ্যাপ হিসেবে হোম স্ক্রিনে রাখুন!'
              : 'দোকান ম্যানেজার অ্যাপটি ফোনে ইনস্টল করে নিন!'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={handleInstallClick}
            style={{
              background: '#fbbf24',
              color: '#0f172a',
              border: 'none',
              borderRadius: '20px',
              padding: '6px 16px',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(251, 191, 36, 0.35)',
              transition: 'transform 0.15s ease'
            }}
          >
            {isIOS ? 'কীভাবে করবেন?' : 'ইন্সটল করুন'}
          </button>
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '2px 6px'
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
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                padding: '9px 28px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
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
