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

/**
 * PUBLIC_INTERFACE
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       description: User signup data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, role]
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: mysecret
 *               role:
 *                 type: string
 *                 enum: [admin, editor, viewer]
 *                 example: viewer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid data or user already exists
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
