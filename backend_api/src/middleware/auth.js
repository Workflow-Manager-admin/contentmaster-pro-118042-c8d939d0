const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';

// PUBLIC_INTERFACE
/**
 * Express middleware: Require a valid JWT and attach user to req.user
 */
function authenticateJWT(req, res, next) {
  // Expected header: Authorization: Bearer <token>
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Missing or invalid Authorization header' });
  }
  const token = authHeader.slice(7); // Remove 'Bearer '
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Invalid token' });
    // Optionally, look up full user details (incl. role name)
    try {
      const user = await User.findByPk(decoded.id, {
        include: [{ model: Role }]
      });
      if (!user) return res.status(401).json({ message: 'User not found' });
      req.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.Role ? user.Role.name : null,
        displayName: user.displayName,
      };
      next();
    } catch (e) {
      res.status(500).json({ message: 'Server error' });
    }
  });
}

// PUBLIC_INTERFACE
/**
 * Express middleware: Restrict to allowed roles
 * Usage: restrictToRoles('admin', 'editor')
 */
function restrictToRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access forbidden: insufficient privileges' });
    }
    next();
  };
}

module.exports = {
  authenticateJWT,
  restrictToRoles,
};
