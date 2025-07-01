const { sequelize } = require('../models');

/**
 * PUBLIC_INTERFACE
 * Synchronize all Sequelize models with the database (initial schema).
 * WARNING: In dev/test, this drops and recreates tables for a fresh start.
 */
async function initDb({ force = false } = {}) {
  try {
    await sequelize.sync({ force });
    console.log(`[DB] All models synchronized${force ? ' (force: true)' : ''}.`);
  } catch (err) {
    console.error('[DB] Error during sync:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  // Use `node src/db/init.js --force` for forced sync
  const forceFlag = process.argv.includes('--force');
  initDb({ force: forceFlag });
}

module.exports = { initDb };
