const express = require('express');
const postController = require('../controllers/posts');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { checkDatabaseConnection } = require('../middleware/database');

const router = express.Router();

// Apply database check middleware to all post routes
router.use(checkDatabaseConnection);

/**
 * @swagger
 * components:
 *   schemas:
 *     Post:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Post ID
 *         title:
 *           type: string
 *           description: Post title
 *         slug:
 *           type: string
 *           description: Post URL slug
 *         content:
 *           type: string
 *           description: Post content (HTML)
 *         excerpt:
 *           type: string
 *           description: Post excerpt
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           description: Post status
 *         author_id:
 *           type: integer
 *           description: Author user ID
 *         featured_image_url:
 *           type: string
 *           description: Featured image URL
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         published_at:
 *           type: string
 *           format: date-time
 *         author_username:
 *           type: string
 *           description: Author username
 *         tags:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Tag'
 *     PostCreate:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 255
 *           description: Post title
 *         slug:
 *           type: string
 *           maxLength: 255
 *           description: Post URL slug
 *         content:
 *           type: string
 *           description: Post content (HTML)
 *         excerpt:
 *           type: string
 *           description: Post excerpt
 *         status:
 *           type: string
 *           enum: [draft, published, archived]
 *           default: draft
 *           description: Post status
 *         featured_image_url:
 *           type: string
 *           format: uri
 *           description: Featured image URL
 *         tags:
 *           type: array
 *           items:
 *             type: integer
 *           description: Array of tag IDs
 */

/**
 * @swagger
 * /posts:
 *   post:
 *     summary: Create a new post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostCreate'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Authentication required
 *       403:
 *         description: Insufficient permissions
 */
router.post('/', authenticate, authorize('admin', 'editor'), postController.createPost.bind(postController));

/**
 * @swagger
 * /posts:
 *   get:
 *     summary: Get all posts with filtering and pagination
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *       - in: query
 *         name: author_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, title, published_at]
 *           default: created_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     posts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Post'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', authenticate, postController.getPosts.bind(postController));

/**
 * @swagger
 * /posts/published:
 *   get:
 *     summary: Get published posts only (public access)
 *     tags: [Posts]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [published_at, title, created_at]
 *           default: published_at
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [ASC, DESC]
 *           default: DESC
 *     responses:
 *       200:
 *         description: Published posts retrieved successfully
 */
router.get('/published', optionalAuth, postController.getPublishedPosts.bind(postController));

/**
 * @swagger
 * /posts/{id}:
 *   get:
 *     summary: Get a post by ID
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     post:
 *                       $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 */
router.get('/:id', authenticate, postController.getPostById.bind(postController));

/**
 * @swagger
 * /posts/slug/{slug}:
 *   get:
 *     summary: Get a post by slug
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *       404:
 *         description: Post not found
 */
router.get('/slug/:slug', optionalAuth, postController.getPostBySlug.bind(postController));

/**
 * @swagger
 * /posts/{id}:
 *   put:
 *     summary: Update a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 255
 *               slug:
 *                 type: string
 *                 maxLength: 255
 *               content:
 *                 type: string
 *               excerpt:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, archived]
 *               featured_image_url:
 *                 type: string
 *                 format: uri
 *               tags:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Post updated successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 */
router.put('/:id', authenticate, postController.updatePost.bind(postController));

/**
 * @swagger
 * /posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 */
router.delete('/:id', authenticate, postController.deletePost.bind(postController));

/**
 * @swagger
 * /posts/{id}/tags:
 *   post:
 *     summary: Add tags to a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tagIds
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Tags added successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 */
router.post('/:id/tags', authenticate, authorize('admin', 'editor'), postController.addTagsToPost.bind(postController));

/**
 * @swagger
 * /posts/{id}/tags:
 *   delete:
 *     summary: Remove tags from a post
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Tag IDs to remove (if not provided, removes all tags)
 *     responses:
 *       200:
 *         description: Tags removed successfully
 *       403:
 *         description: Insufficient permissions
 *       404:
 *         description: Post not found
 */
router.delete('/:id/tags', authenticate, authorize('admin', 'editor'), postController.removeTagsFromPost.bind(postController));

/**
 * @swagger
 * /posts/author/{authorId}:
 *   get:
 *     summary: Get posts by author
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: authorId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived]
 *     responses:
 *       200:
 *         description: Posts by author retrieved successfully
 */
router.get('/author/:authorId', authenticate, postController.getPostsByAuthor.bind(postController));

module.exports = router;
