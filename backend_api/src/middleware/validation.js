const { body, validationResult } = require('express-validator');

// PUBLIC_INTERFACE
/**
 * Express middleware for request validation using express-validator
 */

// Validation rules for user signup
const signupValidation = [
  body('username')
    .isString()
    .trim()
    .isLength({ min: 3, max: 32 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Username must be 3-32 characters, alphanumeric with _ or - allowed'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
    
  body('password')
    .isString()
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be 6-128 characters long'),
    
  body('role')
    .isString()
    .isIn(['admin', 'editor', 'viewer'])
    .withMessage('Role must be one of: admin, editor, viewer')
];

// PUBLIC_INTERFACE
/**
 * Middleware to handle validation results
 */
function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('[Validation] Request validation failed:', {
      errors: errors.array(),
      body: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined }
    });
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg,
        value: err.value
      })),
      timestamp: new Date().toISOString()
    });
  }
  next();
}

// PUBLIC_INTERFACE
/**
 * Middleware to validate JSON request body
 */
function validateJsonBody(req, res, next) {
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    const contentType = req.get('Content-Type');
    if (!contentType || !contentType.includes('application/json')) {
      return res.status(400).json({
        message: 'Content-Type must be application/json',
        received: contentType || 'none',
        timestamp: new Date().toISOString()
      });
    }
    
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({
        message: 'Request body is required and must be valid JSON',
        timestamp: new Date().toISOString()
      });
    }
  }
  next();
}

module.exports = {
  signupValidation,
  handleValidationErrors,
  validateJsonBody
};
