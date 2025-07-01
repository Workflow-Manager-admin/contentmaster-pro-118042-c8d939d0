const Page = require('../models/Page');
const Tag = require('../models/Tag');

class PageService {
  // PUBLIC_INTERFACE
  /**
   * Create a new page
   * @param {Object} pageData - Page creation data
   * @param {number} authorId - Author ID from authenticated user
   * @returns {Promise<Object>} Created page with success message
   */
  async createPage(pageData, authorId) {
    try {
      // Add author ID to page data
      const pageWithAuthor = {
        ...pageData,
        author_id: authorId
      };

      // Create the page
      const page = await Page.create(pageWithAuthor);

      // Handle tags if provided
      if (pageData.tags && Array.isArray(pageData.tags) && pageData.tags.length > 0) {
        await Page.addTags(page.id, pageData.tags);
      }

      return {
        page,
        message: 'Page created successfully'
      };
    } catch (error) {
      console.error('Create page error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all pages with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Pages with pagination info
   */
  async getPages(options = {}) {
    try {
      const result = await Page.findAll(options);
      
      // Get tags for each page
      if (result.pages && result.pages.length > 0) {
        for (const page of result.pages) {
          page.tags = await Tag.getPageTags(page.id);
        }
      }

      return {
        ...result,
        message: 'Pages retrieved successfully'
      };
    } catch (error) {
      console.error('Get pages error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single page by ID
   * @param {number} id - Page ID
   * @returns {Promise<Object>} Page with tags and hierarchy
   */
  async getPageById(id) {
    try {
      const page = await Page.findById(id);
      
      if (!page) {
        throw new Error('Page not found');
      }

      // Get tags for the page
      page.tags = await Tag.getPageTags(id);

      // Get children pages
      page.children = await Page.getChildren(id);

      // Get hierarchy (breadcrumb)
      page.hierarchy = await Page.getHierarchy(id);

      return {
        page,
        message: 'Page retrieved successfully'
      };
    } catch (error) {
      console.error('Get page by ID error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single page by slug
   * @param {string} slug - Page slug
   * @returns {Promise<Object>} Page with tags and hierarchy
   */
  async getPageBySlug(slug) {
    try {
      const page = await Page.findBySlug(slug);
      
      if (!page) {
        throw new Error('Page not found');
      }

      // Get tags for the page
      page.tags = await Tag.getPageTags(page.id);

      // Get children pages
      page.children = await Page.getChildren(page.id);

      // Get hierarchy (breadcrumb)
      page.hierarchy = await Page.getHierarchy(page.id);

      return {
        page,
        message: 'Page retrieved successfully'
      };
    } catch (error) {
      console.error('Get page by slug error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a page
   * @param {number} id - Page ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Updated page
   */
  async updatePage(id, updateData, userId, userRole) {
    try {
      const existingPage = await Page.findById(id);
      
      if (!existingPage) {
        throw new Error('Page not found');
      }

      // Authorization check - only admin, or page author can update
      if (userRole !== 'admin' && existingPage.author_id !== userId) {
        throw new Error('Insufficient permissions to update this page');
      }

      // Extract tags from update data
      const { tags, ...pageUpdateData } = updateData;

      // Update the page
      const updatedPage = await Page.update(id, pageUpdateData);
      
      if (!updatedPage) {
        throw new Error('Page not found');
      }

      // Handle tags update if provided
      if (tags !== undefined) {
        // Remove all existing tags and add new ones
        await Page.removeTags(id);
        if (Array.isArray(tags) && tags.length > 0) {
          await Page.addTags(id, tags);
        }
      }

      // Get updated page with tags and hierarchy
      updatedPage.tags = await Tag.getPageTags(id);
      updatedPage.children = await Page.getChildren(id);
      updatedPage.hierarchy = await Page.getHierarchy(id);

      return {
        page: updatedPage,
        message: 'Page updated successfully'
      };
    } catch (error) {
      console.error('Update page error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a page
   * @param {number} id - Page ID
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async deletePage(id, userId, userRole) {
    try {
      const existingPage = await Page.findById(id);
      
      if (!existingPage) {
        throw new Error('Page not found');
      }

      // Authorization check - only admin, or page author can delete
      if (userRole !== 'admin' && existingPage.author_id !== userId) {
        throw new Error('Insufficient permissions to delete this page');
      }

      const deleted = await Page.delete(id);
      
      if (!deleted) {
        throw new Error('Page not found');
      }

      return {
        message: 'Page deleted successfully'
      };
    } catch (error) {
      console.error('Delete page error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get child pages
   * @param {number} parentId - Parent page ID
   * @returns {Promise<Object>} Child pages
   */
  async getChildPages(parentId) {
    try {
      const children = await Page.getChildren(parentId);

      return {
        pages: children,
        message: 'Child pages retrieved successfully'
      };
    } catch (error) {
      console.error('Get child pages error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get page hierarchy (breadcrumb trail)
   * @param {number} pageId - Page ID
   * @returns {Promise<Object>} Page hierarchy
   */
  async getPageHierarchy(pageId) {
    try {
      const hierarchy = await Page.getHierarchy(pageId);

      return {
        hierarchy,
        message: 'Page hierarchy retrieved successfully'
      };
    } catch (error) {
      console.error('Get page hierarchy error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Add tags to a page
   * @param {number} pageId - Page ID
   * @param {Array<number>} tagIds - Array of tag IDs
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async addTagsToPage(pageId, tagIds, userId, userRole) {
    try {
      const existingPage = await Page.findById(pageId);
      
      if (!existingPage) {
        throw new Error('Page not found');
      }

      // Authorization check - only admin, editor, or page author can add tags
      if (userRole !== 'admin' && userRole !== 'editor' && existingPage.author_id !== userId) {
        throw new Error('Insufficient permissions to add tags to this page');
      }

      await Page.addTags(pageId, tagIds);

      return {
        message: 'Tags added to page successfully'
      };
    } catch (error) {
      console.error('Add tags to page error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Remove tags from a page
   * @param {number} pageId - Page ID
   * @param {Array<number>} tagIds - Array of tag IDs (optional)
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async removeTagsFromPage(pageId, tagIds, userId, userRole) {
    try {
      const existingPage = await Page.findById(pageId);
      
      if (!existingPage) {
        throw new Error('Page not found');
      }

      // Authorization check - only admin, editor, or page author can remove tags
      if (userRole !== 'admin' && userRole !== 'editor' && existingPage.author_id !== userId) {
        throw new Error('Insufficient permissions to remove tags from this page');
      }

      await Page.removeTags(pageId, tagIds);

      return {
        message: 'Tags removed from page successfully'
      };
    } catch (error) {
      console.error('Remove tags from page error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get pages by author
   * @param {number} authorId - Author ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Pages by author
   */
  async getPagesByAuthor(authorId, options = {}) {
    try {
      const queryOptions = {
        ...options,
        author_id: authorId
      };

      const result = await Page.findAll(queryOptions);
      
      // Get tags for each page
      if (result.pages && result.pages.length > 0) {
        for (const page of result.pages) {
          page.tags = await Tag.getPageTags(page.id);
        }
      }

      return {
        ...result,
        message: 'Pages by author retrieved successfully'
      };
    } catch (error) {
      console.error('Get pages by author error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get published pages only
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Published pages
   */
  async getPublishedPages(options = {}) {
    try {
      const queryOptions = {
        ...options,
        status: 'published'
      };

      const result = await Page.findAll(queryOptions);
      
      // Get tags for each page
      if (result.pages && result.pages.length > 0) {
        for (const page of result.pages) {
          page.tags = await Tag.getPageTags(page.id);
        }
      }

      return {
        ...result,
        message: 'Published pages retrieved successfully'
      };
    } catch (error) {
      console.error('Get published pages error:', error);
      throw error;
    }
  }
}

module.exports = new PageService();
