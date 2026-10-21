const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'templeverse_sacred_sanctum_secret_key_108';

/**
 * Middleware to protect routes that require a logged-in devotee
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <TOKEN>

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: Authentication token required.'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Session expired or invalid token. Please sign in again.'
      });
    }
    req.user = user;
    next();
  });
}

/**
 * Optional token verification (attaches user if token present, but doesn't block if missing)
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  JWT_SECRET
};
