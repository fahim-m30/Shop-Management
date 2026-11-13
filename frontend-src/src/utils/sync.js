// Universal Real-Time Broadcaster & Subscriber for Shop Manager
// Handles same-tab, cross-tab (BroadcastChannel & localStorage storage events),
// and cross-device active background sync.

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shop_realtime_sync') : null;

// Helper to get local date string YYYY-MM-DD (Bangladesh Time safe)
export const getLocalDateString = (dateObj = new Date()) => {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Broadcast an update to all open tabs and wipe stale dashboard cache
export const broadcastSync = (reason = 'data_changed') => {
  try {
    // 1. Wipe cached dashboard so fresh numbers are fetched
    localStorage.removeItem('shop_cached_dashboard');
    // 2. Storage event ping for cross-window / cross-tab sync
    localStorage.setItem('shop_sync_ping', `${Date.now()}_${reason}`);
  } catch (e) {}

  // 3. Current window event
  window.dispatchEvent(new CustomEvent('shop-sync', { detail: { reason, time: Date.now() } }));

  // 4. Cross-tab BroadcastChannel
  if (channel) {
    try {
      channel.postMessage({ reason, time: Date.now() });
    } catch (e) {}
  }
};

// Subscribe to real-time sync in components
export const subscribeToSync = (callback, intervalMs = 3000) => {
  const handler = () => callback();

  // Local window event
  window.addEventListener('shop-sync', handler);
  // Focus refetch (when user switches back to this tab/app)
  window.addEventListener('focus', handler);

  // Storage event (cross-tab via localStorage ping)
  const handleStorage = (e) => {
    if (e.key === 'shop_sync_ping') {
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);

  // BroadcastChannel message
  if (channel) {
    channel.onmessage = () => callback();
  }

  // Fast background polling when tab is visible
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      callback();
    }
  }, intervalMs);

  return () => {
    window.removeEventListener('shop-sync', handler);
    window.removeEventListener('focus', handler);
    window.removeEventListener('storage', handleStorage);
    clearInterval(interval);
  };
};
