const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================
// Middleware
// ============================================================
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3001', 'http://localhost:8080'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// ============================================================
// Routes
// ============================================================
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/livestock', require('./routes/livestock'));
app.use('/api/users', require('./routes/users'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running!', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} tidak ditemukan.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal server.',
  });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`\n🚀 Server berjalan di http://localhost:${PORT}`);
  console.log(`📦 API tersedia di http://localhost:${PORT}/api`);
  console.log(`🌿 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
