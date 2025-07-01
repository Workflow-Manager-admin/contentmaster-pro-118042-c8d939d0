const express = require('express');
const postController = require('../controllers/post');
const { authenticateJWT, restrictToRoles } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Posts
 *     description: CRUD operations for blog posts
 *
 * components:
 *   schemas:
 *     Post:
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

// Create Post (admin/editor only)
router.post(
  '/',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  postController.create.bind(postController)
);

// List posts (any authenticated)
router.get(
  '/',
  authenticateJWT,
  postController.list.bind(postController)
);

// Get by ID (any authenticated)
router.get(
  '/:id',
  authenticateJWT,
  postController.getById.bind(postController)
);

// Update post (admin/editor/owner)
router.put(
  '/:id',
  authenticateJWT,
  postController.update.bind(postController)
);

// Delete post (admin/editor/owner)
router.delete(
  '/:id',
  authenticateJWT,
  postController.delete.bind(postController)
);

module.exports = router;
