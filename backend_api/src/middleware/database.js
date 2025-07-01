/**
 * Middleware to check database connectivity before processing requests
 */
const { query } = require('../config/database');

const checkDatabaseConnection = async (req, res, next) => {
  try {
    await query('SELECT 1');
    next();
  } catch (error) {
    console.error('Database connection check failed:', error);
    return res.status(503).json({
      status: 'error',
      message: 'Database service unavailable',
      details: 'Please ensure PostgreSQL is running and properly configured'
    });
  }
};

module.exports = {
  checkDatabaseConnection
};
