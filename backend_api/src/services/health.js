const { sequelize } = require('../models');

class HealthService {
  /**
   * Get service health status including database connectivity
   */
  async getStatus() {
    const status = {
      status: 'ok',
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      components: {
        server: 'ok',
        database: 'unknown'
      }
    };

    try {
      // Test database connection with 5 second timeout
      await Promise.race([
        sequelize.authenticate(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database connection timeout')), 5000)
        )
      ]);
      
      status.components.database = 'ok';
    } catch (error) {
      console.error('[Health] Database connection error:', error);
      status.status = 'error';
      status.message = 'Service degraded';
      status.components.database = 'error';
      status.error = {
        component: 'database',
        message: error.message
      };
    }

    return status;
  }
}
  
module.exports = new HealthService();
