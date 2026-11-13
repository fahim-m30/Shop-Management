const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { realtimeEmitter } = require('../utils/realtime');

// SSE Real-time stream endpoint: GET /api/realtime/stream?token=...
router.get('/stream', (req, res) => {
  const token = req.query.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  let managerId;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    managerId = decoded.id;
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }

  // Set SSE Headers for sub-second real-time streaming
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // Disable buffering for immediate sub-second delivery
    'Access-Control-Allow-Origin': '*'
  });

  // Send connected event immediately
  res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);

  // Event listener for this specific manager
  const listener = (payload) => {
    try {
      res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (e) {}
  };

  const eventName = `change:${managerId.toString()}`;
  realtimeEmitter.on(eventName, listener);

  // Keep-alive heartbeat every 15s to keep connection open through proxies/firewalls
  const heartbeat = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch (e) {}
  }, 15000);

  // Clean up when client disconnects
  req.on('close', () => {
    clearInterval(heartbeat);
    realtimeEmitter.off(eventName, listener);
  });
});

module.exports = router;
