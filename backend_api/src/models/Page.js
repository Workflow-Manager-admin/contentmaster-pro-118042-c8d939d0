const Joi = require('joi');
const { query } = require('../config/database');

// Validation schemas
const pageCreateSchema = Joi.object({
  title: Joi.string().min(1).max(255).required(),
  slug: Joi.string().min(1).max(255).required(),
  content: Joi.string().allow('').optional(),
  status: Joi.string().valid('draft', 'published', 'archived').default('draft'),
  author_id: Joi.number().integer().required(),
  parent_id: Joi.number().integer().allow(null).optional(),
  template: Joi.string().max(100).allow('').optional(),
  meta_title: Joi.string().max(255).allow('').optional(),
  meta_description: Joi.string().allow('').optional()
});

const pageUpdateSchema = Joi.object({
  title: Joi.string().min(1).max(255),
  slug: Joi.string().min(1).max(255),
  content: Joi.string().allow(''),
  status: Joi.string().valid('draft', 'published', 'archived'),
  parent_id: Joi.number().integer().allow(null),
  template: Joi.string().max(100).allow(''),
  meta_title: Joi.string().max(255).allow(''),
  meta_description: Joi.string().allow('')
}).min(1);

class Page {
  constructor(pageData) {
    this.id = pageData.id;
    this.title = pageData.title;
    this.slug = pageData.slug;
    this.content = pageData.content;
    this.status = pageData.status;
    this.author_id = pageData.author_id;
    this.parent_id = pageData.parent_id;
    this.template = pageData.template;
    this.meta_title = pageData.meta_title;
    this.meta_description = pageData.meta_description;
    this.created_at = pageData.created_at;
    this.updated_at = pageData.updated_at;
    this.published_at = pageData.published_at;
  }

  // PUBLIC_INTERFACE
  /**
   * Create a new page
   * @param {Object} pageData - Page data
   * @returns {Promise<Page>} Created page
   */
  static async create(pageData) {
    // Validate input
    const { error, value } = pageCreateSchema.validate(pageData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { title, slug, content, status, author_id, parent_id, template, meta_title, meta_description } = value;
    const published_at = status === 'published' ? new Date() : null;

    // Validate parent_id if provided
    if (parent_id) {
      const parentPage = await Page.findById(parent_id);
      if (!parentPage) {
        throw new Error('Parent page not found');
      }
    }

    try {
      const result = await query(
        `INSERT INTO pages (title, slug, content, status, author_id, parent_id, template, meta_title, meta_description, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [title, slug, content, status, author_id, parent_id, template, meta_title, meta_description, published_at]
      );

      return new Page(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Page slug already exists');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid author or parent page reference');
      }
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Find page by ID
   * @param {number} id - Page ID
   * @returns {Promise<Page|null>} Page or null
   */
  static async findById(id) {
    const result = await query('SELECT * FROM pages WHERE id = $1', [id]);
    return result.rows.length > 0 ? new Page(result.rows[0]) : null;
  }

  // PUBLIC_INTERFACE
  /**
   * Find page by slug
   * @param {string} slug - Page slug
   * @returns {Promise<Page|null>} Page or null
   */
  static async findBySlug(slug) {
    const result = await query('SELECT * FROM pages WHERE slug = $1', [slug]);
    return result.rows.length > 0 ? new Page(result.rows[0]) : null;
  }

  // PUBLIC_INTERFACE
  /**
   * Get all pages with pagination and filtering
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Pages with pagination info
   */
  static async findAll(options = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      author_id,
      parent_id,
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
      conditions.push(`p.status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (author_id) {
      conditions.push(`p.author_id = $${paramCount}`);
      params.push(author_id);
      paramCount++;
    }

    if (parent_id !== undefined) {
      if (parent_id === null) {
        conditions.push('p.parent_id IS NULL');
      } else {
        conditions.push(`p.parent_id = $${paramCount}`);
        params.push(parent_id);
        paramCount++;
      }
    }

    if (search) {
      conditions.push(`(p.title ILIKE $${paramCount} OR p.content ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const orderClause = `ORDER BY p.${sort} ${order.toUpperCase()}`;

    // Get pages with author and parent information
    const pagesQuery = `
      SELECT p.*, 
             u.username as author_username,
             pp.title as parent_title
      FROM pages p
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN pages pp ON p.parent_id = pp.id
      ${whereClause}
      ${orderClause}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM pages p ${whereClause}`;
    const countParams = params.slice(0, paramCount - 2); // Remove limit and offset

    const [pagesResult, countResult] = await Promise.all([
      query(pagesQuery, params),
      query(countQuery, countParams)
    ]);

    const pages = pagesResult.rows.map(row => {
      const page = new Page(row);
      page.author_username = row.author_username;
      page.parent_title = row.parent_title;
      return page;
    });

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      pages,
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
   * Update page
   * @param {number} id - Page ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Page|null>} Updated page or null
   */
  static async update(id, updateData) {
    // Validate input
    const { error, value } = pageUpdateSchema.validate(updateData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    // Prevent circular parent relationship
    if (value.parent_id && value.parent_id === id) {
      throw new Error('Page cannot be its own parent');
    }

    // Validate parent_id if provided
    if (value.parent_id) {
      const parentPage = await Page.findById(value.parent_id);
      if (!parentPage) {
        throw new Error('Parent page not found');
      }
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
        `UPDATE pages SET ${fields.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING *`,
        values
      );

      return result.rows.length > 0 ? new Page(result.rows[0]) : null;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        throw new Error('Page slug already exists');
      }
      if (error.code === '23503') { // Foreign key constraint violation
        throw new Error('Invalid parent page reference');
      }
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Delete page
   * @param {number} id - Page ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    // Check if page has children
    const childrenResult = await query('SELECT COUNT(*) FROM pages WHERE parent_id = $1', [id]);
    const childrenCount = parseInt(childrenResult.rows[0].count);
    
    if (childrenCount > 0) {
      throw new Error('Cannot delete page with child pages');
    }

    const result = await query('DELETE FROM pages WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // PUBLIC_INTERFACE
  /**
   * Get child pages
   * @param {number} parentId - Parent page ID
   * @returns {Promise<Array<Page>>} Array of child pages
   */
  static async getChildren(parentId) {
    const result = await query(
      `SELECT p.*, u.username as author_username
       FROM pages p
       LEFT JOIN users u ON p.author_id = u.id
       WHERE p.parent_id = $1
       ORDER BY p.title`,
      [parentId]
    );

    return result.rows.map(row => {
      const page = new Page(row);
      page.author_username = row.author_username;
      return page;
    });
  }

  // PUBLIC_INTERFACE
  /**
   * Get page hierarchy (breadcrumb)
   * @param {number} pageId - Page ID
   * @returns {Promise<Array<Page>>} Array of pages from root to current
   */
  static async getHierarchy(pageId) {
    const hierarchy = [];
    let currentPage = await Page.findById(pageId);

    while (currentPage) {
      hierarchy.unshift(currentPage);
      if (currentPage.parent_id) {
        currentPage = await Page.findById(currentPage.parent_id);
      } else {
        break;
      }
    }

    return hierarchy;
  }

  // PUBLIC_INTERFACE
  /**
   * Add tags to page
   * @param {number} pageId - Page ID
   * @param {Array<number>} tagIds - Array of tag IDs
   * @returns {Promise<boolean>} Success status
   */
  static async addTags(pageId, tagIds) {
    if (!Array.isArray(tagIds) || tagIds.length === 0) {
      return true;
    }

    const values = tagIds.map((tagId, index) => 
      `($1, $${index + 2})`
    ).join(', ');

    const params = [pageId, ...tagIds];

    try {
      await query(
        `INSERT INTO page_tags (page_id, tag_id) VALUES ${values}
         ON CONFLICT (page_id, tag_id) DO NOTHING`,
        params
      );
      return true;
    } catch (error) {
      console.error('Error adding tags to page:', error);
      throw error;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Remove tags from page
   * @param {number} pageId - Page ID
   * @param {Array<number>} tagIds - Array of tag IDs (optional, removes all if not provided)
   * @returns {Promise<boolean>} Success status
   */
  static async removeTags(pageId, tagIds = null) {
    let query_text, params;

    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      const placeholders = tagIds.map((_, index) => `$${index + 2}`).join(', ');
      query_text = `DELETE FROM page_tags WHERE page_id = $1 AND tag_id IN (${placeholders})`;
      params = [pageId, ...tagIds];
    } else {
      query_text = 'DELETE FROM page_tags WHERE page_id = $1';
      params = [pageId];
    }

    try {
      await query(query_text, params);
      return true;
    } catch (error) {
      console.error('Error removing tags from page:', error);
      throw error;
    }
  }
}

module.exports = Page;
