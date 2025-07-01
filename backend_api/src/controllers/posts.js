const postService = require('../services/posts');

class PostController {
  // PUBLIC_INTERFACE
  /**
   * Create a new post
   */
  async createPost(req, res) {
    try {
      const result = await postService.createPost(req.body, req.user.id);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Create post controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all posts with filtering and pagination
   */
  async getPosts(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        author_id: req.query.author_id ? parseInt(req.query.author_id) : undefined,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC'
      };

      const result = await postService.getPosts(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get posts controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single post by ID
   */
  async getPostById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await postService.getPostById(id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get post by ID controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single post by slug
   */
  async getPostBySlug(req, res) {
    try {
      const slug = req.params.slug;
      const result = await postService.getPostBySlug(slug);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get post by slug controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a post
   */
  async updatePost(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await postService.updatePost(id, req.body, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Update post controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a post
   */
  async deletePost(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await postService.deletePost(id, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Delete post controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Add tags to a post
   */
  async addTagsToPost(req, res) {
    try {
      const postId = parseInt(req.params.id);
      const { tagIds } = req.body;
      
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'tagIds must be an array'
        });
      }
      
      const result = await postService.addTagsToPost(postId, tagIds, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Add tags to post controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Remove tags from a post
   */
  async removeTagsFromPost(req, res) {
    try {
      const postId = parseInt(req.params.id);
      const { tagIds } = req.body;
      
      const result = await postService.removeTagsFromPost(postId, tagIds, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Remove tags from post controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Post not found'
        });
      }
      
      if (error.message.includes('Insufficient permissions')) {
        return res.status(403).json({
          status: 'error',
          message: error.message
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get posts by author
   */
  async getPostsByAuthor(req, res) {
    try {
      const authorId = parseInt(req.params.authorId);
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC'
      };

      const result = await postService.getPostsByAuthor(authorId, options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get posts by author controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get published posts only
   */
  async getPublishedPosts(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        sort: req.query.sort || 'published_at',
        order: req.query.order || 'DESC'
      };

      const result = await postService.getPublishedPosts(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get published posts controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PostController();
