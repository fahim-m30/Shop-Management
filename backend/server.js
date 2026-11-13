const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const https = require('https');
const http = require('http');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Shop Management API is live and running!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/stock', require('./routes/stockRoutes'));
app.use('/api/sales', require('./routes/salesRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/realtime', require('./routes/realtimeRoutes'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);

  // Keep-Alive Self Ping (every 10 minutes to prevent Render free-tier spin-down)
  const SERVER_URL = process.env.SERVER_URL || 'https://shop-management-jj6y.onrender.com';
  setInterval(() => {
    try {
      const client = SERVER_URL.startsWith('https') ? https : http;
      client.get(SERVER_URL, (res) => {
        console.log(`[Keep-Alive] Ping sent to ${SERVER_URL} (Status: ${res.statusCode})`);
      }).on('error', (err) => {
        console.warn(`[Keep-Alive] Ping failed: ${err.message}`);
      });
    } catch (e) {
      console.warn(`[Keep-Alive] Error: ${e.message}`);
    }
  }, 10 * 60 * 1000);
});
