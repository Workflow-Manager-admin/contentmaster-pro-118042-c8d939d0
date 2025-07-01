const express = require('express');
const tagController = require('../controllers/tag');
const { authenticateJWT, restrictToRoles } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Tags
 *     description: CRUD operations for content tags
 * components:
 *   schemas:
 *     Tag:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         name: { type: string }
 *         description: { type: string }
 *       required:
 *         - name
 */
const router = express.Router();

// Create Tag (admin/editor only)
router.post(
  '/',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  tagController.create.bind(tagController)
);

// List tags
router.get(
  '/',
  authenticateJWT,
  tagController.list.bind(tagController)
);

// Get by ID
router.get(
  '/:id',
  authenticateJWT,
  tagController.getById.bind(tagController)
);

// Update tag
router.put(
  '/:id',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  tagController.update.bind(tagController)
);

// Delete tag
router.delete(
  '/:id',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  tagController.delete.bind(tagController)
);

module.exports = router;
