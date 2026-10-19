const jwt = require('jsonwebtoken');
require('dotenv').config();

// Verify JWT token
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = user;
    next();
  });
};

// Role-based access control
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Hanya ${roles.join(' atau ')} yang dapat mengakses fitur ini.`,
      });
    }
    next();
  };
};

module.exports = { authenticate, authorize };
