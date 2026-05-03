const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Routes
const authRoutes = require('./routes/auth.routes');
const questionsRoutes = require('./routes/questions.routes');
const resultsRoutes = require('./routes/results.routes');
const writingRoutes = require('./routes/writing.routes');
const speakingRoutes = require('./routes/speaking.routes');

const app = express();

// ── Middleware ──────────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors());   // Cho phép Expo app gọi API
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check ────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'VSTEP API đang hoạt động',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ── API Routes ──────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/results', resultsRoutes);
app.use('/api/writing', writingRoutes);
app.use('/api/speaking', speakingRoutes);

// ── 404 Handler ─────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} không tồn tại` });
});

// ── Global Error Handler ────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
