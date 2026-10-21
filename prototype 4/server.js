require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const templeRoutes = require('./routes/templeRoutes');
const devoteeRoutes = require('./routes/devoteeRoutes');
const aiRoutes = require('./routes/aiRoutes');
const modelRoutes = require('./routes/modelRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger for API calls
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.path}`);
  }
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/temples', templeRoutes);
app.use('/api/devotee', devoteeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/models', modelRoutes);

// Backend Health & Diagnostics Endpoint
app.get('/api/health', (req, res) => {
  try {
    const templeCount = db.prepare('SELECT COUNT(*) as count FROM temples').get();
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const prarthanaCount = db.prepare('SELECT COUNT(*) as count FROM prarthanas').get();

    res.json({
      status: 'online',
      service: 'TempleVerse Sacred Sanctum Backend',
      database: 'SQLite (WAL Mode)',
      stats: {
        verifiedTemples: templeCount ? templeCount.count : 0,
        registeredDevotees: userCount ? userCount.count : 0,
        sacredPrarthanas: prarthanaCount ? prarthanaCount.count : 0
      },
      endpoints: [
        'POST /api/auth/signup',
        'POST /api/auth/signin',
        'GET  /api/auth/me',
        'GET  /api/temples',
        'GET  /api/temples/summary',
        'GET  /api/temples/circuits/:circuitKey',
        'GET  /api/temples/:id',
        'GET  /api/devotee/favorites',
        'POST /api/devotee/favorites',
        'GET  /api/devotee/prarthana',
        'POST /api/devotee/prarthana',
        'POST /api/ai/chat',
        'POST /api/ai/voice-transcribe',
        'GET  /api/models/benchmark',
        'GET  /api/models/samples',
        'POST /api/models/predict',
        'POST /api/models/xai'
      ],
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// Database Inspection API (for viewing backend data easily)
app.get('/api/database/tables', (req, res) => {
  try {
    const tables = ['temples', 'users', 'prarthanas', 'favorites'];
    const summary = {};
    for (const t of tables) {
      const count = db.prepare(`SELECT count(*) as c FROM ${t}`).get().c;
      summary[t] = count;
    }
    res.json({ success: true, database: 'templeverse.db', counts: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/database/table/:name', (req, res) => {
  try {
    const allowed = ['temples', 'users', 'prarthanas', 'favorites'];
    const name = req.params.name.toLowerCase();
    if (!allowed.includes(name)) {
      return res.status(400).json({ success: false, message: 'Invalid table name' });
    }
    const limit = parseInt(req.query.limit) || 500;
    const offset = parseInt(req.query.offset) || 0;

    let sql = `SELECT * FROM ${name} LIMIT ? OFFSET ?`;
    if (name === 'users') {
      sql = `SELECT id, name, email, state, avatar, created_at, updated_at FROM users LIMIT ? OFFSET ?`;
    }
    const rows = db.prepare(sql).all(limit, offset);
    const total = db.prepare(`SELECT count(*) as c FROM ${name}`).get().c;
    res.json({ success: true, table: name, total, limit, offset, rows });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static assets (HTML, CSS, JS, audio, images)
app.use(express.static(__dirname));

// Single Page Application Fallback (Express 5 compatible)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API route not found' });
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error occurred.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`
  ══════════════════════════════════════════════════════════════
  🕉️  TEMPLEVERSE BACKEND SERVER IS RUNNING & ACTIVE
  ══════════════════════════════════════════════════════════════
  📍 Local URL:     http://localhost:${PORT}
  📡 API Health:    http://localhost:${PORT}/api/health
  🏛️ Temples API:   http://localhost:${PORT}/api/temples
  🔐 Auth API:      http://localhost:${PORT}/api/auth/signin
  💾 Database:      SQLite (prototype 4/templeverse.db)
  ══════════════════════════════════════════════════════════════
  `);
});
