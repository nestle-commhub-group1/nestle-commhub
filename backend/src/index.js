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
  // Connect to the MongoDB Atlas cluster using the URI from .env
  mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected successfully"))
    .catch((err) => console.log("MongoDB connection FAILED:", err.message));
} else {
  // Warn but don't crash — useful when running without a database for local testing
  console.log('MongoDB URI not found in .env, skipping connection');
}

/* ─── CORS Configuration ──────────────────────────────────────────────────── */

// Whitelist of origins that are allowed to call this API.
// We include localhost ports for development, plus the deployed Render frontend URL.
// FRONTEND_URL can be set in .env to support other hosted environments.
const allowedOrigins = [
  "http://localhost:5173",           // Vite dev server default
  "http://localhost:3000",           // Alternative local dev port
  "https://nestle-commhub.onrender.com",     // Standard Render URL
  "https://nestle-commhub-app.onrender.com", // App-suffixed Render URL
  process.env.FRONTEND_URL           // Optional override from .env
].filter(Boolean) // Remove undefined/null values if FRONTEND_URL is not set

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin header (e.g., Postman, mobile apps, same-origin)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)  // Origin is on the whitelist → allow it
    }
    callback(new Error("CORS blocked: " + origin)) // Origin not allowed → block it
  },
  credentials: true,  // Allow cookies and Authorization headers to be sent cross-origin
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",    // For JSON request bodies
    "Authorization"    // For the JWT Bearer token
  ]
}))

/* ─── Body Parsers ────────────────────────────────────────────────────────── */

// Parse incoming JSON bodies — 10mb supports ~7.5MB raw files after base64 encoding
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/* ─── Route Groups ────────────────────────────────────────────────────────── */

const authRoutes         = require('./routes/authRoutes');         // Register + Login
const ticketRoutes       = require('./routes/ticketRoutes');       // CRUD for support tickets
const notificationRoutes = require('./routes/notificationRoutes'); // In-app notifications
const userRoutes         = require('./routes/userRoutes');          // User management (admin)

app.use('/api/auth',          authRoutes);
app.use('/api/tickets',       ticketRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users',         userRoutes);

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
