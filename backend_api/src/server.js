/**
 * Main server entrypoint for backend_api.
 * Loads environment and database, then starts Express server.
 * Ensures database schema is migrated before app serves requests.
 */

const app = require('./app');
require('dotenv').config();

const { initDb } = require('./db/init'); // Ensure DB is initialized before accepting requests

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Wrap server start in async DB initialization
(async () => {
  try {
    // Synchronize DB if first launch
    await initDb({ force: false });
    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running at http://${HOST}:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });
    });
  } catch (err) {
    console.error('[Startup] Failed to initialize server:', err);
    process.exit(1);
  }
})();

