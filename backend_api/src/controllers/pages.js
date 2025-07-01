const pageService = require('../services/pages');

class PageController {
  // PUBLIC_INTERFACE
  /**
   * Create a new page
   */
  async createPage(req, res) {
    try {
      const result = await pageService.createPage(req.body, req.user.id);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Create page controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists') ||
          error.message.includes('not found')) {
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
   * Get all pages with filtering and pagination
   */
  async getPages(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        author_id: req.query.author_id ? parseInt(req.query.author_id) : undefined,
        parent_id: req.query.parent_id ? parseInt(req.query.parent_id) : undefined,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC'
      };

      const result = await pageService.getPages(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get pages controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single page by ID
   */
  async getPageById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await pageService.getPageById(id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get page by ID controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
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
   * Get a single page by slug
   */
  async getPageBySlug(req, res) {
    try {
      const slug = req.params.slug;
      const result = await pageService.getPageBySlug(slug);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get page by slug controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
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
   * Update a page
   */
  async updatePage(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await pageService.updatePage(id, req.body, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Update page controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists') ||
          error.message.includes('cannot be its own parent')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
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
   * Delete a page
   */
  async deletePage(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await pageService.deletePage(id, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Delete page controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
        });
      }
      
      if (error.message.includes('Cannot delete page with child pages')) {
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
   * Get child pages
   */
  async getChildPages(req, res) {
    try {
      const parentId = parseInt(req.params.id);
      const result = await pageService.getChildPages(parentId);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get child pages controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get page hierarchy
   */
  async getPageHierarchy(req, res) {
    try {
      const pageId = parseInt(req.params.id);
      const result = await pageService.getPageHierarchy(pageId);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get page hierarchy controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Add tags to a page
   */
  async addTagsToPage(req, res) {
    try {
      const pageId = parseInt(req.params.id);
      const { tagIds } = req.body;
      
      if (!Array.isArray(tagIds)) {
        return res.status(400).json({
          status: 'error',
          message: 'tagIds must be an array'
        });
      }
      
      const result = await pageService.addTagsToPage(pageId, tagIds, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Add tags to page controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
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
   * Remove tags from a page
   */
  async removeTagsFromPage(req, res) {
    try {
      const pageId = parseInt(req.params.id);
      const { tagIds } = req.body;
      
      const result = await pageService.removeTagsFromPage(pageId, tagIds, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Remove tags from page controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Page not found'
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
   * Get pages by author
   */
  async getPagesByAuthor(req, res) {
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

      const result = await pageService.getPagesByAuthor(authorId, options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get pages by author controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get published pages only
   */
  async getPublishedPages(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        search: req.query.search,
        sort: req.query.sort || 'published_at',
        order: req.query.order || 'DESC'
      };

      const result = await pageService.getPublishedPages(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get published pages controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new PageController();
