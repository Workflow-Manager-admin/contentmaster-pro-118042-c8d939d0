const healthService = require('../services/health');

class HealthController {
  async check(req, res) {
    try {
      const healthStatus = await healthService.getStatus();
      return res.status(200).json(healthStatus);
    } catch (error) {
      console.error('[Health] Health check failed:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Health check failed',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new HealthController();
