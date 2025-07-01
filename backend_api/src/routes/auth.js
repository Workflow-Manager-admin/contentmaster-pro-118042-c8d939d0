const express = require('express');
const authController = require('../controllers/auth');
const { authenticateJWT, restrictToRoles } = require('../middleware/auth');

/**
 * Authentication and Role Routes
 *
 * @swagger
 * tags:
 *   - name: Auth
 *     description: User authentication and role management endpoints
 *
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);

// Only admin can call assign-role
router.post(
  '/assign-role',
  authenticateJWT,
  restrictToRoles('admin'),
  authController.assignRole
);

module.exports = router;
