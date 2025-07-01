const Joi = require('joi');
const { query } = require('../config/database');

// Validation schemas
const tagCreateSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('').optional()
});

const tagUpdateSchema = Joi.object({
  name: Joi.string().min(1).max(100),
  description: Joi.string().allow('')
}).min(1);

class Tag {
  constructor(tagData) {
    this.id = tagData.id;
    this.name = tagData.name;
    this.description = tagData.description;
    this.created_at = tagData.created_at;
  }

  /**
   * Create a new tag
   * @param {Object} tagData - Tag data
   * @returns {Promise<Tag>} Created tag
   */
  static async create(tagData) {
    // Validate input
    const { error, value } = tagCreateSchema.validate(tagData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { name, description } = value;

    try {
      const result = await query(
        'INSERT INTO tags (name, description) VALUES ($1, $2) RETURNING *',
        [name, description]
      );

      return new Tag(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Tag name already exists');
      }
      throw error;
    }
  }

  /**
   * Find tag by ID
   * @param {number} id - Tag ID
   * @returns {Promise<Tag|null>} Tag or null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM tags WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Tag(result.rows[0]) : null;
  }

  /**
   * Find tag by name
   * @param {string} name - Tag name
   * @returns {Promise<Tag|null>} Tag or null
   */
  static async findByName(name) {
    const result = await query('SELECT * FROM tags WHERE name = $1', [name]);
    return result.rows.length > 0 ? new Tag(result.rows[0]) : null;
  }

  /**
   * Get all tags with pagination
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tags with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 50,
      search,
      sort = 'name',
      order = 'ASC'
    } = options;

    const offset = (page - 1) * limit;
    const conditions = [];
    const params = [];
    let paramCount = 1;

    // Build WHERE conditions
    if (search) {
      conditions.push(`(name ILIKE $${paramCount} OR description ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY ${sort} ${order.toUpperCase()}`;

    // Get tags with usage count
    const tagsQuery = `
      SELECT t.*, 
             COALESCE(pt.post_count, 0) as post_count,
             COALESCE(pgt.page_count, 0) as page_count
      FROM tags t
      LEFT JOIN (
        SELECT tag_id, COUNT(*) as post_count 
        FROM post_tags 
        GROUP BY tag_id
      ) pt ON t.id = pt.tag_id
      LEFT JOIN (
        SELECT tag_id, COUNT(*) as page_count 
        FROM page_tags 
        GROUP BY tag_id
      ) pgt ON t.id = pgt.tag_id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM tags t ${whereClause}`;
    const countParams = params.slice(0, paramCount - 2); // Remove limit and offset

    const [tagsResult, countResult] = await Promise.all([
      query(tagsQuery, params),
      query(countQuery, countParams)
    ]);

    const tags = tagsResult.rows.map(row => {
      const tag = new Tag(row);
      tag.post_count = parseInt(row.post_count) || 0;
      tag.page_count = parseInt(row.page_count) || 0;
      tag.usage_count = tag.post_count + tag.page_count;
      return tag;
    });

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      tags,
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
   * Update tag
   * @param {number} id - Tag ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Tag|null>} Updated tag or null
   */
  static async update(id, updateData) {
    // Validate input
    const { error, value } = tagUpdateSchema.validate(updateData);
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
        `UPDATE tags SET ${fields.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Tag(result.rows[0]) : null;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Tag name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete tag
   * @param {number} id - Tag ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const result = await query('DELETE FROM tags WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get tags for a specific post
   * @param {number} postId - Post ID
   * @returns {Promise<Array<Tag>>} Array of tags
   */
  static async getPostTags(postId) {
    const result = await query(
      `SELECT t.* FROM tags t
       INNER JOIN post_tags pt ON t.id = pt.tag_id
       WHERE pt.post_id = $1
       ORDER BY t.name`,
      [postId]
    );

    return result.rows.map(row => new Tag(row));
  }

  /**
   * Get tags for a specific page
   * @param {number} pageId - Page ID
   * @returns {Promise<Array<Tag>>} Array of tags
   */
  static async getPageTags(pageId) {
    const result = await query(
      `SELECT t.* FROM tags t
       INNER JOIN page_tags pt ON t.id = pt.tag_id
       WHERE pt.page_id = $1
       ORDER BY t.name`,
      [pageId]
    );

    return result.rows.map(row => new Tag(row));
  }
}

module.exports = Tag;
