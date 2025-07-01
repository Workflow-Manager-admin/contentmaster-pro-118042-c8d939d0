const authService = require('../services/auth');

/**
 * Authentication Controller
 * Exposes login, signup, and role assignment endpoints.
 */
class AuthController {
  /**
   * @swagger
   * /auth/signup:
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
  async signup(req, res) {
    try {
      console.log('[AuthController] Signup request received:', {
        body: req.body,
        contentType: req.get('Content-Type'),
        userAgent: req.get('User-Agent')
      });

      const { username, email, password, role } = req.body;
      
      // Log request data (without password)
      console.log('[AuthController] Extracted signup data:', { 
        username, 
        email, 
        role, 
        hasPassword: !!password 
      });

      const result = await authService.signup({ username, email, password, role });
      
      console.log('[AuthController] Signup successful for user:', result.username);
      res.status(201).json(result);
    } catch (err) {
      console.error('[AuthController] Signup failed:', {
        error: err.message,
        stack: err.stack,
        requestBody: { ...req.body, password: req.body.password ? '[REDACTED]' : undefined }
      });
      
      res.status(400).json({ 
        message: err.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login with username/email and password
   *     tags: [Auth]
   *     requestBody:
   *       description: User credentials
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [usernameOrEmail, password]
   *             properties:
   *               usernameOrEmail:
   *                 type: string
   *                 example: johndoe
   *               password:
   *                 type: string
   *                 format: password
   *                 example: mysecret
   *     responses:
   *       200:
   *         description: JWT access token in response
   *       401:
   *         description: Authentication failed
   */
  async login(req, res) {
    try {
      const { usernameOrEmail, password } = req.body;
      const result = await authService.login({ usernameOrEmail, password });
      res.status(200).json(result);
    } catch (err) {
      res.status(401).json({ message: err.message });
    }
  }

  /**
   * @swagger
   * /auth/assign-role:
   *   post:
   *     summary: Assign a role to a user (admin only)
   *     tags: [Auth]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       description: Role assignment data
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required: [userId, role]
   *             properties:
   *               userId:
   *                 type: integer
   *                 example: 1
   *               role:
   *                 type: string
   *                 enum: [admin, editor, viewer]
   *                 example: editor
   *     responses:
   *       200:
   *         description: Role updated
   *       403:
   *         description: Only admin can assign roles
   *       404:
   *         description: User or role not found
   */
  async assignRole(req, res) {
    try {
      const { userId, role } = req.body;
      await authService.assignRole({ userId, role, requester: req.user });
      res.status(200).json({ message: 'User role updated' });
    } catch (err) {
      const code = /forbid|admin/i.test(err.message) ? 403 : 404;
      res.status(code).json({ message: err.message });
    }
  }

  // Optionally, add a verifyToken endpoint for debugging.
}

module.exports = new AuthController();
