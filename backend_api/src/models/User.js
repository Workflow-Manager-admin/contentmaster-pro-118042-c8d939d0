const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { query } = require('../config/database');

// Validation schemas
const userCreateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'editor', 'viewer').default('viewer')
});

const userUpdateSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(50),
  email: Joi.string().email(),
  role: Joi.string().valid('admin', 'editor', 'viewer')
}).min(1);

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

class User {
  constructor(userData) {
    this.id = userData.id;
    this.username = userData.username;
    this.email = userData.email;
    this.role = userData.role;
    this.created_at = userData.created_at;
    this.updated_at = userData.updated_at;
  }

  /**
   * Create a new user
   * @param {Object} userData - User data
   * @returns {Promise<User>} Created user
   */
  static async create(userData) {
    // Validate input
    const { error, value } = userCreateSchema.validate(userData);
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const { username, email, password, role } = value;

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    try {
      const result = await query(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         RETURNING id, username, email, role, created_at, updated_at`,
        [username, email, passwordHash, role]
      );

      return new User(result.rows[0]);
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Find user by ID
   * @param {number} id - User ID
   * @returns {Promise<User|null>} User or null
   */
  static async findById(id) {
    const result = await query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<User|null>} User or null
   */
  static async findByEmail(email) {
    const result = await query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Promise<User|null>} User or null
   */
  static async findByUsername(username) {
    const result = await query(
      'SELECT id, username, email, role, created_at, updated_at FROM users WHERE username = $1',
      [username]
    );

    return result.rows.length > 0 ? new User(result.rows[0]) : null;
  }

  /**
   * Authenticate user with email and password
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<User|null>} Authenticated user or null
   */
  static async authenticate(email, password) {
    // Validate input
    const { error } = loginSchema.validate({ email, password });
    if (error) {
      throw new Error(`Validation error: ${error.details[0].message}`);
    }

    const result = await query(
      'SELECT id, username, email, password_hash, role, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const userData = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);

    if (!isValidPassword) {
      return null;
    }

    // Remove password_hash from returned data
    delete userData.password_hash;
    return new User(userData);
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<User|null>} Updated user or null
   */
  static async update(id, updateData) {
    // Validate input
    const { error, value } = userUpdateSchema.validate(updateData);
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

    // Add ID for WHERE clause
    values.push(id);

    try {
      const result = await query(
        `UPDATE users SET ${fields.join(', ')} 
         WHERE id = $${paramCount}
         RETURNING id, username, email, role, created_at, updated_at`,
        values
      );

      return result.rows.length > 0 ? new User(result.rows[0]) : null;
    } catch (error) {
      if (error.code === '23505') { // Unique constraint violation
        if (error.constraint === 'users_email_key') {
          throw new Error('Email already exists');
        }
        if (error.constraint === 'users_username_key') {
          throw new Error('Username already exists');
        }
      }
      throw error;
    }
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  static async delete(id) {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  /**
   * Get all users with pagination
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Number of users per page
   * @returns {Promise<Object>} Users with pagination info
   */
  static async findAll(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [usersResult, countResult] = await Promise.all([
      query(
        `SELECT id, username, email, role, created_at, updated_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      query('SELECT COUNT(*) FROM users')
    ]);

    const users = usersResult.rows.map(row => new User(row));
    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    return {
      users,
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
   * Change user password
   * @param {number} id - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} True if changed successfully
   */
  static async changePassword(id, currentPassword, newPassword) {
    // Validate new password
    const { error } = Joi.string().min(6).validate(newPassword);
    if (error) {
      throw new Error('New password must be at least 6 characters long');
    }

    // Get current password hash
    const result = await query(
      'SELECT password_hash FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { password_hash } = result.rows[0];
    const isValidPassword = await bcrypt.compare(currentPassword, password_hash);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await query(
      'UPDATE users SET password_hash = $1, updated_at = $2 WHERE id = $3',
      [newPasswordHash, new Date(), id]
    );

    return true;
  }
}

module.exports = User;
