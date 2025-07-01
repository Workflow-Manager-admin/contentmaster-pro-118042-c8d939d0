const tagService = require('../services/tags');

class TagController {
  // PUBLIC_INTERFACE
  /**
   * Create a new tag
   */
  async createTag(req, res) {
    try {
      const result = await tagService.createTag(req.body, req.user.role);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Create tag controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
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
   * Get all tags with filtering and pagination
   */
  async getTags(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        search: req.query.search,
        sort: req.query.sort || 'name',
        order: req.query.order || 'ASC'
      };

      const result = await tagService.getTags(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single tag by ID
   */
  async getTagById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await tagService.getTagById(id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get tag by ID controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Tag not found'
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
   * Get a single tag by name
   */
  async getTagByName(req, res) {
    try {
      const name = req.params.name;
      const result = await tagService.getTagByName(name);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get tag by name controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Tag not found'
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
   * Update a tag
   */
  async updateTag(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await tagService.updateTag(id, req.body, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Update tag controller error:', error);
      
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
          message: 'Tag not found'
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
   * Delete a tag
   */
  async deleteTag(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await tagService.deleteTag(id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Delete tag controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Tag not found'
        });
      }
      
      if (error.message.includes('currently being used')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
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
   * Get tags for a specific post
   */
  async getPostTags(req, res) {
    try {
      const postId = parseInt(req.params.postId);
      const result = await tagService.getPostTags(postId);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get post tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get tags for a specific page
   */
  async getPageTags(req, res) {
    try {
      const pageId = parseInt(req.params.pageId);
      const result = await tagService.getPageTags(pageId);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get page tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Search tags
   */
  async searchTags(req, res) {
    try {
      const searchTerm = req.query.q;
      
      if (!searchTerm) {
        return res.status(400).json({
          status: 'error',
          message: 'Search term is required'
        });
      }

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sort: req.query.sort || 'name',
        order: req.query.order || 'ASC'
      };

      const result = await tagService.searchTags(searchTerm, options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Search tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get popular tags
   */
  async getPopularTags(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await tagService.getPopularTags(limit);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get popular tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get unused tags
   */
  async getUnusedTags(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        sort: req.query.sort || 'name',
        order: req.query.order || 'ASC'
      };

      const result = await tagService.getUnusedTags(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get unused tags controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Bulk create tags
   */
  async bulkCreateTags(req, res) {
    try {
      const { tagNames } = req.body;
      
      if (!Array.isArray(tagNames) || tagNames.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'tagNames must be a non-empty array'
        });
      }

      const result = await tagService.bulkCreateTags(tagNames, req.user.role);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Bulk create tags controller error:', error);
      
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
}

module.exports = new TagController();
