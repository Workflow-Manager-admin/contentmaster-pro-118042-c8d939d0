const express = require('express');
const healthController = require('../controllers/health');
const authRoutes = require('./auth');
const postRoutes = require('./posts');
const pageRoutes = require('./pages');
const mediaRoutes = require('./media');
const tagRoutes = require('./tags');

const router = express.Router();
// Health endpoint

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health endpoint
 *     responses:
 *       200:
 *         description: Service health check passed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: Service is healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/', healthController.check.bind(healthController));

 // Mount authentication and role-based endpoints
router.use('/auth', authRoutes);

// Register new routers here
router.use('/posts', postRoutes);
router.use('/pages', pageRoutes);
router.use('/media', mediaRoutes);
router.use('/tags', tagRoutes);

module.exports = router;
