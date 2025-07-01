const authService = require('../services/auth');

class AuthController {
  /**
   * Handle user signup
   */
  async signup(req, res) {
    try {
      const result = await authService.signup(req.body);
      
      res.status(201).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Signup controller error:', error);
      
      // Handle validation errors
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists')) {
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

  /**
   * Handle user login
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Login controller error:', error);
      
      if (error.message.includes('Invalid email or password') ||
          error.message.includes('Validation error')) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid email or password'
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get user profile
   */
  async getProfile(req, res) {
    try {
      const result = await authService.getProfile(req.user.id);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get profile controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req, res) {
    try {
      const result = await authService.updateProfile(req.user.id, req.body);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Update profile controller error:', error);
      
      if (error.message.includes('Validation error') || 
          error.message.includes('already exists')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  /**
   * Change user password
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const result = await authService.changePassword(
        req.user.id, 
        currentPassword, 
        newPassword
      );
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Change password controller error:', error);
      
      if (error.message.includes('Current password is incorrect') ||
          error.message.includes('must be at least')) {
        return res.status(400).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          status: 'error',
          message: 'User not found'
        });
      }
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }

  /**
   * Get all users (admin only)
   */
  async getUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      
      const result = await authService.getUsers(page, limit);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      console.error('Get users controller error:', error);
      
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  }
}

module.exports = new AuthController();
