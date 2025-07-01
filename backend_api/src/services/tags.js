const Tag = require('../models/Tag');

class TagService {
  // PUBLIC_INTERFACE
  /**
   * Create a new tag
   * @param {Object} tagData - Tag creation data
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Created tag with success message
   */
  async createTag(tagData, userRole) {
    try {
      // Authorization check - only admin and editor can create tags
      if (userRole !== 'admin' && userRole !== 'editor') {
        throw new Error('Insufficient permissions to create tags');
      }

      const tag = await Tag.create(tagData);

      return {
        tag,
        message: 'Tag created successfully'
      };
    } catch (error) {
      console.error('Create tag error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all tags with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tags with pagination info
   */
  async getTags(options = {}) {
    try {
      const result = await Tag.findAll(options);

      return {
        ...result,
        message: 'Tags retrieved successfully'
      };
    } catch (error) {
      console.error('Get tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single tag by ID
   * @param {number} id - Tag ID
   * @returns {Promise<Object>} Tag with usage information
   */
  async getTagById(id) {
    try {
      const tag = await Tag.findById(id);
      
      if (!tag) {
        throw new Error('Tag not found');
      }

      return {
        tag,
        message: 'Tag retrieved successfully'
      };
    } catch (error) {
      console.error('Get tag by ID error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single tag by name
   * @param {string} name - Tag name
   * @returns {Promise<Object>} Tag with usage information
   */
  async getTagByName(name) {
    try {
      const tag = await Tag.findByName(name);
      
      if (!tag) {
        throw new Error('Tag not found');
      }

      return {
        tag,
        message: 'Tag retrieved successfully'
      };
    } catch (error) {
      console.error('Get tag by name error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a tag
   * @param {number} id - Tag ID
   * @param {Object} updateData - Update data
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Updated tag
   */
  async updateTag(id, updateData, userRole) {
    try {
      // Authorization check - only admin and editor can update tags
      if (userRole !== 'admin' && userRole !== 'editor') {
        throw new Error('Insufficient permissions to update tags');
      }

      const updatedTag = await Tag.update(id, updateData);
      
      if (!updatedTag) {
        throw new Error('Tag not found');
      }

      return {
        tag: updatedTag,
        message: 'Tag updated successfully'
      };
    } catch (error) {
      console.error('Update tag error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a tag
   * @param {number} id - Tag ID
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async deleteTag(id, userRole) {
    try {
      // Authorization check - only admin can delete tags
      if (userRole !== 'admin') {
        throw new Error('Insufficient permissions to delete tags');
      }

      const existingTag = await Tag.findById(id);
      
      if (!existingTag) {
        throw new Error('Tag not found');
      }

      // Check if tag is being used
      if (existingTag.post_count > 0 || existingTag.page_count > 0) {
        throw new Error('Cannot delete tag that is currently being used');
      }

      const deleted = await Tag.delete(id);
      
      if (!deleted) {
        throw new Error('Tag not found');
      }

      return {
        message: 'Tag deleted successfully'
      };
    } catch (error) {
      console.error('Delete tag error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get tags for a specific post
   * @param {number} postId - Post ID
   * @returns {Promise<Object>} Tags for the post
   */
  async getPostTags(postId) {
    try {
      const tags = await Tag.getPostTags(postId);

      return {
        tags,
        postId,
        message: 'Post tags retrieved successfully'
      };
    } catch (error) {
      console.error('Get post tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get tags for a specific page
   * @param {number} pageId - Page ID
   * @returns {Promise<Object>} Tags for the page
   */
  async getPageTags(pageId) {
    try {
      const tags = await Tag.getPageTags(pageId);

      return {
        tags,
        pageId,
        message: 'Page tags retrieved successfully'
      };
    } catch (error) {
      console.error('Get page tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Search tags by name or description
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchTags(searchTerm, options = {}) {
    try {
      const queryOptions = {
        ...options,
        search: searchTerm
      };

      const result = await Tag.findAll(queryOptions);

      return {
        ...result,
        searchTerm,
        message: 'Tag search completed successfully'
      };
    } catch (error) {
      console.error('Search tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get popular tags (most used)
   * @param {number} limit - Number of tags to return
   * @returns {Promise<Object>} Popular tags
   */
  async getPopularTags(limit = 10) {
    try {
      const result = await Tag.findAll({
        limit,
        sort: 'usage_count',
        order: 'DESC'
      });

      // Filter out tags with no usage
      const popularTags = result.tags.filter(tag => tag.usage_count > 0);

      return {
        tags: popularTags,
        message: 'Popular tags retrieved successfully'
      };
    } catch (error) {
      console.error('Get popular tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get unused tags
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Unused tags
   */
  async getUnusedTags(options = {}) {
    try {
      const result = await Tag.findAll(options);

      // Filter for tags with no usage
      const unusedTags = result.tags.filter(tag => tag.usage_count === 0);

      return {
        tags: unusedTags,
        pagination: {
          ...result.pagination,
          total: unusedTags.length
        },
        message: 'Unused tags retrieved successfully'
      };
    } catch (error) {
      console.error('Get unused tags error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Bulk create tags from array of names
   * @param {Array<string>} tagNames - Array of tag names
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Created tags and any errors
   */
  async bulkCreateTags(tagNames, userRole) {
    try {
      // Authorization check - only admin and editor can create tags
      if (userRole !== 'admin' && userRole !== 'editor') {
        throw new Error('Insufficient permissions to create tags');
      }

      const results = {
        created: [],
        errors: [],
        existing: []
      };

      for (const name of tagNames) {
        try {
          // Check if tag already exists
          const existingTag = await Tag.findByName(name.trim());
          
          if (existingTag) {
            results.existing.push(existingTag);
          } else {
            // Create new tag
            const newTag = await Tag.create({ name: name.trim() });
            results.created.push(newTag);
          }
        } catch (error) {
          results.errors.push({
            name: name.trim(),
            error: error.message
          });
        }
      }

      return {
        results,
        message: `Bulk tag creation completed. Created: ${results.created.length}, Existing: ${results.existing.length}, Errors: ${results.errors.length}`
      };
    } catch (error) {
      console.error('Bulk create tags error:', error);
      throw error;
    }
  }
}

module.exports = new TagService();
