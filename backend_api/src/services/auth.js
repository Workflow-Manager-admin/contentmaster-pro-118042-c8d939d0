const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

class AuthService {
  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} User and token
   */
  async signup(userData) {
    try {
      // Create user
      const user = await User.create(userData);
      
      // Generate token
      const token = generateToken(user);
      
      return {
        user,
        token,
        message: 'User registered successfully'
      };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} User and token
   */
  async login(email, password) {
    try {
      // Authenticate user
      const user = await User.authenticate(email, password);
      
      if (!user) {
        throw new Error('Invalid email or password');
      }
      
      // Generate token
      const token = generateToken(user);
      
      return {
        user,
        token,
        message: 'Login successful'
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    try {
      const user = await User.findById(userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        user,
        message: 'Profile retrieved successfully'
      };
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   * @param {number} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated user
   */
  async updateProfile(userId, updateData) {
    try {
      const user = await User.update(userId, updateData);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return {
        user,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      await User.changePassword(userId, currentPassword, newPassword);
      
      return {
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Users with pagination
   */
  async getUsers(page = 1, limit = 10) {
    try {
      const result = await User.findAll(page, limit);
      
      return {
        ...result,
        message: 'Users retrieved successfully'
      };
    } catch (error) {
      console.error('Get users error:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();
