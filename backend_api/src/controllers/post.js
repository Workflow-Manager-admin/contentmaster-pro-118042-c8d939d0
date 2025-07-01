const postService = require('../services/post');

/**
 * Post Controller
 * Handles CRUD operations for posts with role-based access.
 */
class PostController {
  // PUBLIC_INTERFACE
  /**
   * Create a new post.
   */
  async create(req, res) {
    try {
      const post = await postService.create(req.body, req.user);
      res.status(201).json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get list of posts with search/pagination.
   */
  async list(req, res) {
    try {
      const { items, total, page, pageSize } =
        await postService.list(req.query);
      res.json({ items, total, page, pageSize });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single post by ID.
   */
  async getById(req, res) {
    try {
      const post = await postService.getById(req.params.id);
      if (!post) return res.status(404).json({ message: 'Post not found' });
      res.json(post);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a post by ID.
   */
  async update(req, res) {
    try {
      const updated = await postService.update(
        req.params.id,
        req.body,
        req.user
      );
      if (!updated) return res.status(404).json({ message: 'Post not found' });
      res.json(updated);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a post by ID.
   */
  async delete(req, res) {
    try {
      await postService.delete(req.params.id, req.user);
      res.status(204).send();
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
}

module.exports = new PostController();
