const mediaService = require('../services/media');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../../uploads');
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

class MediaController {
  // PUBLIC_INTERFACE
  /**
   * Upload a media file
   */
  async uploadMedia(req, res) {
    try {
      // Use multer middleware for file upload
      upload.single('file')(req, res, async (err) => {
        if (err) {
          console.error('File upload error:', err);
          
          if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
              return res.status(400).json({
                status: 'error',
                message: 'File size too large. Maximum size is 50MB.'
              });
            }
          }
          
          return res.status(400).json({
            status: 'error',
            message: err.message || 'File upload failed'
          });
        }

        if (!req.file) {
          return res.status(400).json({
            status: 'error',
            message: 'No file provided'
          });
        }

        try {
          const metadata = {
            alt_text: req.body.alt_text || '',
            caption: req.body.caption || ''
          };

          const result = await mediaService.uploadMedia(req.file, req.user.id, metadata);
          
          res.status(201).json({
            status: 'success',
            data: result
          });
        } catch (serviceError) {
          console.error('Media service error:', serviceError);
          
          res.status(500).json({
            status: 'error',
            message: 'Failed to save media information'
          });
        }
      });
    } catch (error) {
      console.error('Upload media controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get all media with filtering and pagination
   */
  async getMedia(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        mime_type: req.query.mime_type,
        uploaded_by: req.query.uploaded_by ? parseInt(req.query.uploaded_by) : undefined,
        search: req.query.search,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC'
      };

      const result = await mediaService.getMedia(options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get media controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get a single media item by ID
   */
  async getMediaById(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await mediaService.getMediaById(id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get media by ID controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Media not found'
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
   * Update media metadata
   */
  async updateMedia(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await mediaService.updateMedia(id, req.body, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Update media controller error:', error);
      
      if (error.message.includes('Validation error')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Media not found'
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
   * Delete a media file
   */
  async deleteMedia(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await mediaService.deleteMedia(id, req.user.id, req.user.role);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Delete media controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Media not found'
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
   * Get media by type
   */
  async getMediaByType(req, res) {
    try {
      const type = req.params.type;
      const options = {
        limit: parseInt(req.query.limit) || 10,
        offset: parseInt(req.query.offset) || 0
      };

      const result = await mediaService.getMediaByType(type, options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get media by type controller error:', error);
      
      if (error.message.includes('Invalid media type')) {
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
   * Get media statistics
   */
  async getMediaStats(req, res) {
    try {
      const result = await mediaService.getMediaStats();
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get media stats controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Get recent media uploads
   */
  async getRecentMedia(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const result = await mediaService.getRecentMedia(limit);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get recent media controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Check media usage
   */
  async checkMediaUsage(req, res) {
    try {
      const id = parseInt(req.params.id);
      const result = await mediaService.checkMediaUsage(id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Check media usage controller error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'Media not found'
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
   * Search media
   */
  async searchMedia(req, res) {
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
        limit: parseInt(req.query.limit) || 20,
        mime_type: req.query.mime_type,
        sort: req.query.sort || 'created_at',
        order: req.query.order || 'DESC'
      };

      const result = await mediaService.searchMedia(searchTerm, options);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Search media controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new MediaController();
