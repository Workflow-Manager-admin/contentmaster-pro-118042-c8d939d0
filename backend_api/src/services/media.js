const Media = require('../models/Media');
const path = require('path');
const fs = require('fs').promises;

class MediaService {
  // PUBLIC_INTERFACE
  /**
   * Upload a new media file
   * @param {Object} fileData - File upload data from multer
   * @param {number} uploadedBy - User ID who uploaded the file
   * @param {Object} metadata - Additional metadata (alt_text, caption)
   * @returns {Promise<Object>} Created media record
   */
  async uploadMedia(fileData, uploadedBy, metadata = {}) {
    try {
      const { filename, originalname, mimetype, size, path: filePath } = fileData;
      const { alt_text, caption } = metadata;

      const mediaData = {
        filename,
        original_name: originalname,
        mime_type: mimetype,
        file_size: size,
        file_path: filePath,
        alt_text: alt_text || '',
        caption: caption || '',
        uploaded_by: uploadedBy
      };

      const media = await Media.create(mediaData);

      return {
        media,
        message: 'Media uploaded successfully'
      };
    } catch (error) {
      console.error('Upload media error:', error);
      
      // Clean up uploaded file if database operation failed
      if (fileData && fileData.path) {
        try {
          await fs.unlink(fileData.path);
        } catch (unlinkError) {
          console.error('Failed to clean up uploaded file:', unlinkError);
        }
      }
      
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all media with filtering and pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Media with pagination info
   */
  async getMedia(options = {}) {
    try {
      const result = await Media.findAll(options);

      return {
        ...result,
        message: 'Media retrieved successfully'
      };
    } catch (error) {
      console.error('Get media error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single media item by ID
   * @param {number} id - Media ID
   * @returns {Promise<Object>} Media item
   */
  async getMediaById(id) {
    try {
      const media = await Media.findById(id);
      
      if (!media) {
        throw new Error('Media not found');
      }

      // Get usage information
      const usage = await Media.checkUsage(id);
      media.usage = usage;

      return {
        media,
        message: 'Media retrieved successfully'
      };
    } catch (error) {
      console.error('Get media by ID error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Update media metadata
   * @param {number} id - Media ID
   * @param {Object} updateData - Update data (alt_text, caption)
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Updated media
   */
  async updateMedia(id, updateData, userId, userRole) {
    try {
      const existingMedia = await Media.findById(id);
      
      if (!existingMedia) {
        throw new Error('Media not found');
      }

      // Authorization check - only admin, editor, or uploader can update
      if (userRole !== 'admin' && userRole !== 'editor' && existingMedia.uploaded_by !== userId) {
        throw new Error('Insufficient permissions to update this media');
      }

      const updatedMedia = await Media.update(id, updateData);
      
      if (!updatedMedia) {
        throw new Error('Media not found');
      }

      return {
        media: updatedMedia,
        message: 'Media updated successfully'
      };
    } catch (error) {
      console.error('Update media error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete a media file
   * @param {number} id - Media ID
   * @param {number} userId - User ID for authorization check
   * @param {string} userRole - User role for authorization check
   * @returns {Promise<Object>} Success message
   */
  async deleteMedia(id, userId, userRole) {
    try {
      const existingMedia = await Media.findById(id);
      
      if (!existingMedia) {
        throw new Error('Media not found');
      }

      // Authorization check - only admin, or uploader can delete
      if (userRole !== 'admin' && existingMedia.uploaded_by !== userId) {
        throw new Error('Insufficient permissions to delete this media');
      }

      // Check if media is being used
      const usage = await Media.checkUsage(id);
      if (usage.is_used) {
        throw new Error('Cannot delete media that is currently being used in posts or pages');
      }

      // Delete from database
      const deleted = await Media.delete(id);
      
      if (!deleted) {
        throw new Error('Media not found');
      }

      // Delete physical file
      try {
        await fs.unlink(existingMedia.file_path);
      } catch (fileError) {
        console.warn('Failed to delete physical file:', fileError);
        // Don't throw error if file deletion fails, as database record is already deleted
      }

      return {
        message: 'Media deleted successfully'
      };
    } catch (error) {
      console.error('Delete media error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get media by type
   * @param {string} type - Media type (image, video, audio, document)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Media by type
   */
  async getMediaByType(type, options = {}) {
    try {
      const validTypes = ['image', 'video', 'audio', 'document'];
      
      if (!validTypes.includes(type)) {
        throw new Error('Invalid media type. Must be one of: image, video, audio, document');
      }

      const media = await Media.getByType(type, options);

      return {
        media,
        type,
        message: `${type} media retrieved successfully`
      };
    } catch (error) {
      console.error('Get media by type error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get media statistics
   * @returns {Promise<Object>} Media statistics
   */
  async getMediaStats() {
    try {
      const stats = await Media.getStats();

      return {
        stats,
        message: 'Media statistics retrieved successfully'
      };
    } catch (error) {
      console.error('Get media stats error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get recent media uploads
   * @param {number} limit - Number of items to return
   * @returns {Promise<Object>} Recent media uploads
   */
  async getRecentMedia(limit = 10) {
    try {
      const media = await Media.getRecent(limit);

      return {
        media,
        message: 'Recent media retrieved successfully'
      };
    } catch (error) {
      console.error('Get recent media error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Check media usage in posts and pages
   * @param {number} id - Media ID
   * @returns {Promise<Object>} Usage information
   */
  async checkMediaUsage(id) {
    try {
      const usage = await Media.checkUsage(id);

      return {
        usage,
        message: 'Media usage information retrieved successfully'
      };
    } catch (error) {
      console.error('Check media usage error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get media by uploader
   * @param {number} uploaderId - Uploader user ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Media by uploader
   */
  async getMediaByUploader(uploaderId, options = {}) {
    try {
      const queryOptions = {
        ...options,
        uploaded_by: uploaderId
      };

      const result = await Media.findAll(queryOptions);

      return {
        ...result,
        message: 'Media by uploader retrieved successfully'
      };
    } catch (error) {
      console.error('Get media by uploader error:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Search media by filename or metadata
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Search results
   */
  async searchMedia(searchTerm, options = {}) {
    try {
      const queryOptions = {
        ...options,
        search: searchTerm
      };

      const result = await Media.findAll(queryOptions);

      return {
        ...result,
        searchTerm,
        message: 'Media search completed successfully'
      };
    } catch (error) {
      console.error('Search media error:', error);
      throw error;
    }
  }
}

module.exports = new MediaService();
