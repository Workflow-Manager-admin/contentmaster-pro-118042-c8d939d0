const express = require('express');
const multer = require('multer');
const path = require('path');
const mediaController = require('../controllers/media');
const { authenticateJWT, restrictToRoles } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Media
 *     description: Media file upload, browse, and delete
 * components:
 *   schemas:
 *     Media:
 *       type: object
 *       properties:
 *         id: { type: integer }
 *         url: { type: string }
 *         filename: { type: string }
 *         uploaderId: { type: integer }
 *         mimeType: { type: string }
 *         size: { type: integer }
 *         altText: { type: string }
 *         createdAt: { type: string, format: date-time }
 *         updatedAt: { type: string, format: date-time }
 *       required:
 *         - url
 *         - filename
 */

// Configure multer for uploads directory
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const router = express.Router();

// Upload media file (admin/editor only)
router.post(
  '/upload',
  authenticateJWT,
  restrictToRoles('admin', 'editor'),
  upload.single('file'),
  mediaController.upload.bind(mediaController)
);

// List/browse media
router.get(
  '/',
  authenticateJWT,
  mediaController.list.bind(mediaController)
);

// Get media meta by ID
router.get(
  '/:id',
  authenticateJWT,
  mediaController.getById.bind(mediaController)
);

// Delete media (admin/editor/uploader)
router.delete(
  '/:id',
  authenticateJWT,
  mediaController.delete.bind(mediaController)
);

module.exports = router;
