const { query } = require('../config/database');

class HealthService {
    async getStatus() {
      const health = {
        status: 'ok',
        message: 'Service is healthy',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
          api: 'healthy',
          database: 'unknown'
        }
      };

      // Check database connection
      try {
        await query('SELECT 1');
        health.services.database = 'healthy';
      } catch (error) {
        health.services.database = 'unhealthy';
        health.status = 'degraded';
        health.message = 'Service running with degraded functionality';
      }

      return health;
    }
  }
  
module.exports = new HealthService();
