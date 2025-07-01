const healthService = require('../services/health');

class HealthController {
  async check(req, res) {
    try {
      const healthStatus = await healthService.getStatus();
      const statusCode = healthStatus.status === 'ok' ? 200 : 503;
      return res.status(statusCode).json(healthStatus);
    } catch (error) {
      console.error('Health check error:', error);
      return res.status(503).json({
        status: 'error',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    }
  }
}

module.exports = new HealthController();
