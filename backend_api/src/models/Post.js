const Joi = require('joi');
const { query } = require('../config/database');

// Validation schemas
const postCreateSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(255).required(),
  content: Joi.string().allow('').optional(),
  excerpt: Joi.string().allow('').optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  author_id: Joi.number().integer().required(),
  featured_image_url: Joi.string().uri().allow('').optional()
});

const postUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  slug: Joi.string().min(1).max(255),
  content: Joi.string().allow(''),
  excerpt: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'published', 'archived'),
  featured_image_url: Joi.string().uri().allow('')
}).min(1);

class Post {
  constructor(postData) {
    this.id = postData.id;
    this.title = postData.title;
    this.slug = postData.slug;
    this.content = postData.content;
    this.excerpt = postData.excerpt;
    this.status = postData.status;
    this.author_id = postData.author_id;
    this.featured_image_url = postData.featured_image_url;
    this.created_at = postData.created_at;
    this.updated_at = postData.updated_at;
    this.published_at = postData.published_at;
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data
   * @returns {Promise<Post>} Created post
   */
  static async create(postData) {
    // Validate input
    const { error, value } = postCreateSchema.validate(postData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { title, slug, content, excerpt, status, author_id, featured_image_url } = value;
    const published_at = status === 'published' ? new Date() : null;

    try {
      const result = await query(
        `INSERT INTO posts (title, slug, content, excerpt, status, author_id, featured_image_url, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [title, slug, content, excerpt, status, author_id, featured_image_url, published_at]
      );

      return new Post(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Post slug already exists');
      }
      throw error;
    }
  }

  /**
   * Find post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Post|null>} Post or null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM posts WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Post(result.rows[0]) : null;
  }

  /**
   * Find post by slug
   * @param {string} slug - Post slug
   * @returns {Promise<Post|null>} Post or null
   */
  static async findBySlug(slug) {
    const result = await query('SELECT * FROM posts WHERE slug = $1', [slug]);
    return result.rows.length > 0 ? new Post(result.rows[0]) : null;
  }

  /**
   * Get all posts with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Posts with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      author_id,
      search,
      sort = 'created_at',
      order = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (status) {
      conditions.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (author_id) {
      conditions.push(`author_id = $${paramCount}`);
      params.push(author_id);
      paramCount++;
    }

    if (search) {
      conditions.push(`(title ILIKE $${paramCount} OR content ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;

    // Get posts
    const postsQuery = `
      SELECT p.*, u.username as author_username
      FROM posts p
      LEFT JOIN users u ON p.author_id = u.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM posts p ${whereClause}`;
    const countParams = params.slice(0, paramCount - 2); // Remove limit and offset

    const [postsResult, countResult] = await Promise.all([
      query(postsQuery, params),
      query(countQuery, countParams)
    ]);

    const posts = postsResult.rows.map(row => {
      const post = new Post(row);
      post.author_username = row.author_username;
      return post;
    });

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      posts,
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

  /**
   * Update post
   * @param {number} id - Post ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Post|null>} Updated post or null
   */
  static async update(id, updateData) {
    // Validate input
    const { error, value } = postUpdateSchema.validate(updateData);
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

    // Add updated_at
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    paramCount++;

    // Update published_at if status changed to published
    if (value.status === 'published') {
      fields.push(`published_at = $${paramCount}`);
      values.push(new Date());
      paramCount++;
    }

    // Add ID for WHERE clause
    values.push(id);

    try {
      const result = await query(
        `UPDATE posts SET ${fields.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Post(result.rows[0]) : null;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Post slug already exists');
      }
      throw error;
    }
  }

  /**
   * Delete post
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const result = await query('DELETE FROM posts WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Add tags to post
   * @param {number} postId - Post ID
   * @param {Array<number>} tagIds - Array of tag IDs
   * @returns {Promise<boolean>} Success status
   */
  static async addTags(postId, tagIds) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return true;
    }

    const values = tagIds.map((tagId, index) => 
      `($1, $${index + 2})`
    ).join(', ');

    const params = [postId, ...tagIds];

    try {
      await query(
        `INSERT INTO post_tags (post_id, tag_id) VALUES ${values}
         ON CONFLICT (post_id, tag_id) DO NOTHING`,
        params
      );
      return true;
    } catch (error) {
      console.error('Error adding tags to post:', error);
      throw error;
    }
  }

  /**
   * Remove tags from post
   * @param {number} postId - Post ID
   * @param {Array<number>} tagIds - Array of tag IDs (optional, removes all if not provided)
   * @returns {Promise<boolean>} Success status
   */
  static async removeTags(postId, tagIds = null) {
    let query_text, params;

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const placeholders = tagIds.map((_, index) => `$${index + 2}`).join(', ');
      query_text = `DELETE FROM post_tags WHERE post_id = $1 AND tag_id IN (${placeholders})`;
      params = [postId, ...tagIds];
    } else {
      query_text = 'DELETE FROM post_tags WHERE post_id = $1';
      params = [postId];
    }

    try {
      await query(query_text, params);
      return true;
    } catch (error) {
      console.error('Error removing tags from post:', error);
      throw error;
    }
  }
}

module.exports = Post;
