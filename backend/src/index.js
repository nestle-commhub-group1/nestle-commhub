/**
 * index.js
 *
 * The main entry point for the Nestlé CommHub backend server.
 *
 * Key responsibilities:
 * - Connects to MongoDB and starts the Express server
 * - Configures CORS so only trusted frontend origins can call the API
 * - Mounts all route groups under /api/*
 * - Starts the SLA auto-escalation background job
 * - Runs a keep-alive ping on Render to prevent free-tier sleep
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config(); // Load .env variables into process.env before anything else

const app = express();
const PORT = process.env.PORT || 5001; // Render sets PORT automatically; 5001 is the local fallback

/* ─── Database Connection ─────────────────────────────────────────────────── */

const mongoose = require('mongoose');
if (process.env.MONGO_URI) {
  console.log('[MONGO] Connection URI detected');
  console.log('[MONGO] URI length:', process.env.MONGO_URI.length);
  console.log('[MONGO] URI starts with:', process.env.MONGO_URI.substring(0, 30));
  console.log('[MONGO] URI ends with:', process.env.MONGO_URI.substring(process.env.MONGO_URI.length - 30));
  
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 5000,
    connectTimeoutMS: 5000
  })
    .then(() => {
      console.log('[✅ MONGO] Connected successfully');
      console.log('[✅ MONGO] Connection state:', mongoose.connection.readyState);
    })
    .catch((err) => {
      console.log('[❌ MONGO] Connection failed');
      console.log('[❌ MONGO] Error name:', err.name);
      console.log('[❌ MONGO] Error code:', err.code);
      console.log('[❌ MONGO] Error message:', err.message);
      console.log('[❌ MONGO] Full error:', err);
    });
} else {
  console.log('[⚠️ MONGO] MONGO_URI not found in environment');
  console.log('[⚠️ MONGO] Available env vars:', Object.keys(process.env).slice(0, 20));
}

/* ─── CORS Configuration ──────────────────────────────────────────────────── */

// ─── Simplifed CORS configuration for production troubleshooting ──────────────────
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

/* ─── Body Parsers ────────────────────────────────────────────────────────── */

// Parse incoming JSON bodies — 10mb supports ~7.5MB raw files after base64 encoding
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ─── Route Groups ────────────────────────────────────────────────────────── */

const authRoutes         = require('./routes/authRoutes');         // Register + Login
const ticketRoutes       = require('./routes/ticketRoutes');       // CRUD for support tickets
const notificationRoutes = require('./routes/notificationRoutes'); // In-app notifications
const userRoutes         = require('./routes/userRoutes');          // User management (admin)
const promotionRoutes    = require('./routes/promotionRoutes');     // Promotions management
const messageRoutes      = require('./routes/messageRoutes');       // Multi-channel messaging
const productRoutes      = require('./routes/productRoutes');       // Product management
const orderRoutes        = require('./routes/orderRoutes');         // Order management
const insightRoutes      = require('./routes/insightRoutes');       // AI insights

app.use('/api/auth',          authRoutes);
app.use('/api/tickets',       ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/promotions',    promotionRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/insights',      insightRoutes);

/* ─── Background Jobs ─────────────────────────────────────────────────────── */

// Start the SLA checker job — runs every 30 min to auto-escalate overdue tickets
require('./jobs/slaChecker');

/* ─── Utility Endpoints ───────────────────────────────────────────────────── */

// Root endpoint — confirms the API is reachable (used for quick browser checks)
app.get('/', (req, res) => {
  res.json({ message: 'Nestlé CommHub API is running 🚀' });
});

// Health check — returns minimal status only (no internal info exposed)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

/* ─── Server Start ────────────────────────────────────────────────────────── */

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // ─── Render Keep-Alive ────────────────────────────────────────────────────
  // Render's free tier spins down inactive services after 15 minutes.
  // This pings /api/health every 14 minutes to keep the server awake.
  // RENDER_EXTERNAL_URL is set automatically by Render, so this block
  // only runs in production — never locally.
  const RENDER_EXTERNAL_URL = process.env.RENDER_EXTERNAL_URL;
  if (RENDER_EXTERNAL_URL) {
    const https = require('https');
    console.log(`Keep-alive ping enabled → ${RENDER_EXTERNAL_URL}/api/health (every 14 min)`);
    setInterval(() => {
      https.get(`${RENDER_EXTERNAL_URL}/api/health`, res => {
        console.log(`Keep-alive ping: ${res.statusCode}`);
      }).on('error', err => {
        console.error('Keep-alive ping failed:', err.message);
      });
    }, 14 * 60 * 1000); // 14 minutes in milliseconds
  }
});
