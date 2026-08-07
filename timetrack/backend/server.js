require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const path     = require('path');
const rateLimit = require('express-rate-limit');

const { testConnection } = require('./config/database');
const errorHandler       = require('./middleware/errorHandler');

// ─── Routes ───────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const userRoutes      = require('./routes/users');
const sessionRoutes   = require('./routes/sessions');
const categoryRoutes  = require('./routes/categories');
const reportRoutes    = require('./routes/reports');
const alertRoutes     = require('./routes/alerts');
const adminRoutes     = require('./routes/admin');
const settingsRoutes  = require('./routes/settings');
const bridgeRoutes    = require('./routes/bridge');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── Security Middleware ───────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods:     ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Bridge-Key'],
}));

// ─── Rate Limiting ────────────────────────────────────────
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max:      parseInt(process.env.RATE_LIMIT_MAX || '200'),
  message:  { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// ─── General Middleware ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ─── Static Files ──────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── Health Check ──────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'TimeTrack API is running', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api/auth',       authLimiter, authRoutes);
app.use('/api/users',      userRoutes);
app.use('/api/sessions',   sessionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/reports',    reportRoutes);
app.use('/api/alerts',     alertRoutes);
app.use('/api/admin',      adminRoutes);
app.use('/api/settings',   settingsRoutes);
app.use('/api/bridge',     bridgeRoutes);

// ─── 404 Handler ──────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────
const start = async () => {
  await testConnection();
  app.listen(PORT, () => {
    console.log(`\n🚀 TimeTrack API Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Frontend:    ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`);
  });
};

start();

module.exports = app;
