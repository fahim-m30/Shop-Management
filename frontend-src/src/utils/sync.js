// Universal Sub-Second (< 1s) Real-Time Broadcaster & Subscriber for Shop Manager
// 1. Native Server-Sent Events (SSE) stream for sub-second cross-device push (< 100ms)
// 2. BroadcastChannel for 0ms cross-tab updates
// 3. Storage event ping for cross-window sync
// 4. Sub-second 800ms fallback polling (< 1s)
import { getBaseURL } from '../api/api';

const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('shop_realtime_sync') : null;

// Global singleton SSE connection to minimize open connections
let eventSource = null;
const sseSubscribers = new Set();
let reconnectTimer = null;

const notifySubscribers = () => {
  // Wipe stale dashboard cache
  try {
    localStorage.removeItem('shop_cached_dashboard');
  } catch (e) {}

  // Trigger all active subscriber callbacks
  sseSubscribers.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.error(e);
    }
  });
};

const setupSSE = () => {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('token');
  if (!token) {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    return;
  }

  // If already open or connecting, do not create duplicate
  if (eventSource && (eventSource.readyState === EventSource.OPEN || eventSource.readyState === EventSource.CONNECTING)) {
    return;
  }

  try {
    const sseUrl = `${getBaseURL()}/realtime/stream?token=${encodeURIComponent(token)}`;
    eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type !== 'connected') {
          // SUB-SECOND LIVE NOTIFICATION: Fires in ~50-100ms
          notifySubscribers();
          broadcastSync('sse_received');
        }
      } catch (e) {}
    };

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        if (sseSubscribers.size > 0) setupSSE();
      }, 2000);
    };
  } catch (e) {
    console.warn('[SSE] Connection error:', e);
  }
};

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
    // 2. Storage event ping for cross-window / cross-tab sync (0ms)
    localStorage.setItem('shop_sync_ping', `${Date.now()}_${reason}`);
  } catch (e) {}

  // 3. Current window event (0ms)
  window.dispatchEvent(new CustomEvent('shop-sync', { detail: { reason, time: Date.now() } }));

  // 4. Cross-tab BroadcastChannel (0ms)
  if (channel) {
    try {
      channel.postMessage({ reason, time: Date.now() });
    } catch (e) {}
  }
};

// Subscribe to real-time sync in components with sub-second interval (< 1s)
export const subscribeToSync = (callback, intervalMs = 800) => {
  const handler = () => callback();
  sseSubscribers.add(callback);

  // Connect singleton SSE for < 100ms updates across devices
  setupSSE();

  // Local window event (0ms)
  window.addEventListener('shop-sync', handler);
  // Focus refetch (0ms)
  window.addEventListener('focus', handler);

  // Storage event (cross-tab via localStorage ping, 0ms)
  const handleStorage = (e) => {
    if (e.key === 'shop_sync_ping') {
      callback();
    }
  };
  window.addEventListener('storage', handleStorage);

  // BroadcastChannel message (cross-tab, 0ms)
  if (channel) {
    channel.onmessage = () => callback();
  }

  // Active sub-second polling fallback (< 1s default 800ms)
  const interval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      callback();
    }
  }, intervalMs);

  return () => {
    sseSubscribers.delete(callback);
    window.removeEventListener('shop-sync', handler);
    window.removeEventListener('focus', handler);
    window.removeEventListener('storage', handleStorage);
    clearInterval(interval);
    if (sseSubscribers.size === 0 && eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };
};
