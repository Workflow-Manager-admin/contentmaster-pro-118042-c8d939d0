const Joi = require('joi');
const { query } = require('../config/database');

// Validation schemas
const mediaCreateSchema = Joi.object({
  filename: Joi.string().min(1).max(255).required(),
  original_name: Joi.string().min(1).max(255).required(),
  mime_type: Joi.string().min(1).max(100).required(),
  file_size: Joi.number().integer().min(0).required(),
  file_path: Joi.string().min(1).max(500).required(),
  alt_text: Joi.string().max(255).allow('').optional(),
  caption: Joi.string().allow('').optional(),
  uploaded_by: Joi.number().integer().required()
});

const mediaUpdateSchema = Joi.object({
  alt_text: Joi.string().max(255).allow(''),
  caption: Joi.string().allow('')
}).min(1);

class Media {
  constructor(mediaData) {
    this.id = mediaData.id;
    this.filename = mediaData.filename;
    this.original_name = mediaData.original_name;
    this.mime_type = mediaData.mime_type;
    this.file_size = mediaData.file_size;
    this.file_path = mediaData.file_path;
    this.alt_text = mediaData.alt_text;
    this.caption = mediaData.caption;
    this.uploaded_by = mediaData.uploaded_by;
    this.created_at = mediaData.created_at;
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new media record
   * @param {Object} mediaData - Media data
   * @returns {Promise<Media>} Created media record
   */
  static async create(mediaData) {
    // Validate input
    const { error, value } = mediaCreateSchema.validate(mediaData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { filename, original_name, mime_type, file_size, file_path, alt_text, caption, uploaded_by } = value;

    try {
      const result = await query(
        `INSERT INTO media (filename, original_name, mime_type, file_size, file_path, alt_text, caption, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [filename, original_name, mime_type, file_size, file_path, alt_text, caption, uploaded_by]
      );

      return new Media(result.rows[0]);
    } catch (error) {
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid user reference');
      }
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Find media by ID
   * @param {number} id - Media ID
   * @returns {Promise<Media|null>} Media or null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM media WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Media(result.rows[0]) : null;
  }

  // PUBLIC_INTERFACE
  /**
   * Find media by filename
   * @param {string} filename - Media filename
   * @returns {Promise<Media|null>} Media or null
   */
  static async findByFilename(filename) {
    const result = await query('SELECT * FROM media WHERE filename = $1', [filename]);
    return result.rows.length > 0 ? new Media(result.rows[0]) : null;
  }

  // PUBLIC_INTERFACE
  /**
   * Get all media with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Media with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 20,
      mime_type,
      uploaded_by,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (mime_type) {
      if (mime_type === 'image') {
        conditions.push('m.mime_type LIKE \'image/%\'');
      } else if (mime_type === 'video') {
        conditions.push('m.mime_type LIKE \'video/%\'');
      } else if (mime_type === 'audio') {
        conditions.push('m.mime_type LIKE \'audio/%\'');
      } else if (mime_type === 'document') {
        conditions.push('m.mime_type IN (\'application/pdf\', \'application/msword\', \'application/vnd.openxmlformats-officedocument.wordprocessingml.document\', \'text/plain\')');
      } else {
        conditions.push(`m.mime_type = $${paramCount}`);
        params.push(mime_type);
        paramCount++;
      }
    }

    if (uploaded_by) {
      conditions.push(`m.uploaded_by = $${paramCount}`);
      params.push(uploaded_by);
      paramCount++;
    }

    if (search) {
      conditions.push(`(m.original_name ILIKE $${paramCount} OR m.alt_text ILIKE $${paramCount} OR m.caption ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY m.${sort} ${order.toUpperCase()}`;

    // Get media with uploader information
    const mediaQuery = `
      SELECT m.*, u.username as uploader_username
      FROM media m
      LEFT JOIN users u ON m.uploaded_by = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM media m ${whereClause}`;
    const countParams = params.slice(0, paramCount - 2); // Remove limit and offset

    const [mediaResult, countResult] = await Promise.all([
      query(mediaQuery, params),
      query(countQuery, countParams)
    ]);

    const media = mediaResult.rows.map(row => {
      const mediaItem = new Media(row);
      mediaItem.uploader_username = row.uploader_username;
      return mediaItem;
    });

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      media,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Update media metadata
   * @param {number} id - Media ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Media|null>} Updated media or null
   */
  static async update(id, updateData) {
    // Validate input
    const { error, value } = mediaUpdateSchema.validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(value).forEach(key => {
      fields.push(`${key} = $${paramCount}`);
      values.push(value[key]);
      paramCount++;
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    // Add ID for WHERE clause
    values.push(id);

    try {
      const result = await query(
        `UPDATE media SET ${fields.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Media(result.rows[0]) : null;
    } catch (error) {
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete media
   * @param {number} id - Media ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const result = await query('DELETE FROM media WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // PUBLIC_INTERFACE
  /**
   * Get media statistics
   * @returns {Promise<Object>} Media statistics
   */
  static async getStats() {
    const statsQuery = `
      SELECT 
        COUNT(*) as total_files,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count,
        COUNT(CASE WHEN mime_type LIKE 'video/%' THEN 1 END) as video_count,
        COUNT(CASE WHEN mime_type LIKE 'audio/%' THEN 1 END) as audio_count,
        COUNT(CASE WHEN mime_type NOT LIKE 'image/%' AND mime_type NOT LIKE 'video/%' AND mime_type NOT LIKE 'audio/%' THEN 1 END) as document_count
      FROM media
    `;

    const result = await query(statsQuery);
    const stats = result.rows[0];

    return {
      total_files: parseInt(stats.total_files) || 0,
      total_size: parseInt(stats.total_size) || 0,
      image_count: parseInt(stats.image_count) || 0,
      video_count: parseInt(stats.video_count) || 0,
      audio_count: parseInt(stats.audio_count) || 0,
      document_count: parseInt(stats.document_count) || 0
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Get media by type
   * @param {string} type - Media type (image, video, audio, document)
   * @param {Object} options - Query options
   * @returns {Promise<Array<Media>>} Array of media items
   */
  static async getByType(type, options = {}) {
    const { limit = 10, offset = 0 } = options;
    let mimeCondition;

    switch (type) {
      case 'image':
        mimeCondition = 'mime_type LIKE \'image/%\'';
        break;
      case 'video':
        mimeCondition = 'mime_type LIKE \'video/%\'';
        break;
      case 'audio':
        mimeCondition = 'mime_type LIKE \'audio/%\'';
        break;
      case 'document':
        mimeCondition = 'mime_type IN (\'application/pdf\', \'application/msword\', \'application/vnd.openxmlformats-officedocument.wordprocessingml.document\', \'text/plain\')';
        break;
      default:
        throw new Error('Invalid media type');
    }

    const result = await query(
      `SELECT m.*, u.username as uploader_username
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       WHERE ${mimeCondition}
       ORDER BY m.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    return result.rows.map(row => {
      const mediaItem = new Media(row);
      mediaItem.uploader_username = row.uploader_username;
      return mediaItem;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Check if media is used in posts or pages
   * @param {number} id - Media ID
   * @returns {Promise<Object>} Usage information
   */
  static async checkUsage(id) {
    const media = await Media.findById(id);
    if (!media) {
      throw new Error('Media not found');
    }

    const mediaUrl = media.file_path;
    const imagePattern = `%${mediaUrl}%`;

    const [postsResult, pagesResult] = await Promise.all([
      query(
        `SELECT id, title, slug FROM posts 
         WHERE content LIKE $1 OR featured_image_url = $2`,
        [imagePattern, mediaUrl]
      ),
      query(
        `SELECT id, title, slug FROM pages 
         WHERE content LIKE $1`,
        [imagePattern]
      )
    ]);

    return {
      is_used: postsResult.rows.length > 0 || pagesResult.rows.length > 0,
      used_in_posts: postsResult.rows,
      used_in_pages: pagesResult.rows
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Get recently uploaded media
   * @param {number} limit - Number of items to return
   * @returns {Promise<Array<Media>>} Array of recent media items
   */
  static async getRecent(limit = 10) {
    const result = await query(
      `SELECT m.*, u.username as uploader_username
       FROM media m
       LEFT JOIN users u ON m.uploaded_by = u.id
       ORDER BY m.created_at DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => {
      const mediaItem = new Media(row);
      mediaItem.uploader_username = row.uploader_username;
      return mediaItem;
    });
  }
}

module.exports = Media;
