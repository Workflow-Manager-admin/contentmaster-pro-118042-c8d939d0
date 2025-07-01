const express = require('express');
const pageController = require('../controllers/page');
const { authenticateJWT, restrictToRoles } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Pages
 *     description: CRUD operations for static pages
 * components:
 *   schemas:
 *     Page:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         status:
 *           type: string
 *         publishedAt:
 *           type: string
 *           format: date-time
 *         userId:
 *           type: integer
 *         featuredImageId:
 *           type: integer
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *       required:
 *         - title
 *         - content
 */
const router = express.Router();

// Create Page (admin/editor only)
router.post(
  '/',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  pageController.create.bind(pageController)
);

// List pages
router.get(
  '/',
  authenticateJWT,
  pageController.list.bind(pageController)
);

// Get by ID
router.get(
  '/:id',
  authenticateJWT,
  pageController.getById.bind(pageController)
);

// Update page
router.put(
  '/:id',
  authenticateJWT,
  pageController.update.bind(pageController)
);

// Delete page
router.delete(
  '/:id',
  authenticateJWT,
  pageController.delete.bind(pageController)
);

module.exports = router;
