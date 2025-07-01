const Post = require('../models/Post');
const Tag = require('../models/Tag');

class PostService {
  // PUBLIC_INTERFACE
  /**
   * Create a new post
   * @param {Object} postData - Post creation data
   * @param {number} authorId - Author ID from authenticated user
   * @returns {Promise<Object>} Created post with success message
   */
  async createPost(postData, authorId) {
    try {
      // Add author ID to post data
      const postWithAuthor = {
        ...postData,
        author_id: authorId
      };

      // Create the post
      const post = await Post.create(postWithAuthor);

      // Handle tags if provided
      if (postData.tags && Array.isArray(postData.tags) && postData.tags.length > 0) {
        await Post.addTags(post.id, postData.tags);
      }

      return {
        post,
        message: 'Post created successfully'
      };
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all posts with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Posts with pagination info
   */
  async getPosts(options = {}) {
    try {
      const result = await Post.findAll(options);
      
      // Get tags for each post
      if (result.posts && result.posts.length > 0) {
        for (const post of result.posts) {
          post.tags = await Tag.getPostTags(post.id);
        }
      }

      return {
        ...result,
        message: 'Posts retrieved successfully'
      };
    } catch (error) {
      console.error('Get posts error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Object>} Post with tags
   */
  async getPostById(id) {
    try {
      const post = await Post.findById(id);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Get tags for the post
      post.tags = await Tag.getPostTags(id);

      return {
        post,
        message: 'Post retrieved successfully'
      };
    } catch (error) {
      console.error('Get post by ID error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single post by slug
   * @param {string} slug - Post slug
   * @returns {Promise<Object>} Post with tags
   */
  async getPostBySlug(slug) {
    try {
      const post = await Post.findBySlug(slug);
      
      if (!post) {
        throw new Error('Post not found');
      }

      // Get tags for the post
      post.tags = await Tag.getPostTags(post.id);

      return {
        post,
        message: 'Post retrieved successfully'
      };
    } catch (error) {
      console.error('Get post by slug error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update a post
   * @param {number} id - Post ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Updated post
   */
  async updatePost(id, updateData, userId, userRole) {
    try {
      const existingPost = await Post.findById(id);
      
      if (!existingPost) {
        throw new Error('Post not found');
      }

      // Authorization check - only admin, or post author can update
      if (userRole !== 'admin' && existingPost.author_id !== userId) {
        throw new Error('Insufficient permissions to update this post');
      }

      // Extract tags from update data
      const { tags, ...postUpdateData } = updateData;

      // Update the post
      const updatedPost = await Post.update(id, postUpdateData);
      
      if (!updatedPost) {
        throw new Error('Post not found');
      }

      // Handle tags update if provided
      if (tags !== undefined) {
        // Remove all existing tags and add new ones
        await Post.removeTags(id);
        if (Array.isArray(tags) && tags.length > 0) {
          await Post.addTags(id, tags);
        }
      }

      // Get updated post with tags
      updatedPost.tags = await Tag.getPostTags(id);

      return {
        post: updatedPost,
        message: 'Post updated successfully'
      };
    } catch (error) {
      console.error('Update post error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a post
   * @param {number} id - Post ID
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async deletePost(id, userId, userRole) {
    try {
      const existingPost = await Post.findById(id);
      
      if (!existingPost) {
        throw new Error('Post not found');
      }

      // Authorization check - only admin, or post author can delete
      if (userRole !== 'admin' && existingPost.author_id !== userId) {
        throw new Error('Insufficient permissions to delete this post');
      }

      const deleted = await Post.delete(id);
      
      if (!deleted) {
        throw new Error('Post not found');
      }

      return {
        message: 'Post deleted successfully'
      };
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Add tags to a post
   * @param {number} postId - Post ID
   * @param {Array<number>} tagIds - Array of tag IDs
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async addTagsToPost(postId, tagIds, userId, userRole) {
    try {
      const existingPost = await Post.findById(postId);
      
      if (!existingPost) {
        throw new Error('Post not found');
      }

      // Authorization check - only admin, editor, or post author can add tags
      if (userRole !== 'admin' && userRole !== 'editor' && existingPost.author_id !== userId) {
        throw new Error('Insufficient permissions to add tags to this post');
      }

      await Post.addTags(postId, tagIds);

      return {
        message: 'Tags added to post successfully'
      };
    } catch (error) {
      console.error('Add tags to post error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Remove tags from a post
   * @param {number} postId - Post ID
   * @param {Array<number>} tagIds - Array of tag IDs (optional)
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async removeTagsFromPost(postId, tagIds, userId, userRole) {
    try {
      const existingPost = await Post.findById(postId);
      
      if (!existingPost) {
        throw new Error('Post not found');
      }

      // Authorization check - only admin, editor, or post author can remove tags
      if (userRole !== 'admin' && userRole !== 'editor' && existingPost.author_id !== userId) {
        throw new Error('Insufficient permissions to remove tags from this post');
      }

      await Post.removeTags(postId, tagIds);

      return {
        message: 'Tags removed from post successfully'
      };
    } catch (error) {
      console.error('Remove tags from post error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get posts by author
   * @param {number} authorId - Author ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Posts by author
   */
  async getPostsByAuthor(authorId, options = {}) {
    try {
      const queryOptions = {
        ...options,
        author_id: authorId
      };

      const result = await Post.findAll(queryOptions);
      
      // Get tags for each post
      if (result.posts && result.posts.length > 0) {
        for (const post of result.posts) {
          post.tags = await Tag.getPostTags(post.id);
        }
      }

      return {
        ...result,
        message: 'Posts by author retrieved successfully'
      };
    } catch (error) {
      console.error('Get posts by author error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get published posts only
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Published posts
   */
  async getPublishedPosts(options = {}) {
    try {
      const queryOptions = {
        ...options,
        status: 'published'
      };

      const result = await Post.findAll(queryOptions);
      
      // Get tags for each post
      if (result.posts && result.posts.length > 0) {
        for (const post of result.posts) {
          post.tags = await Tag.getPostTags(post.id);
        }
      }

      return {
        ...result,
        message: 'Published posts retrieved successfully'
      };
    } catch (error) {
      console.error('Get published posts error:', error);
      throw error;
    }
  }
}

module.exports = new PostService();
