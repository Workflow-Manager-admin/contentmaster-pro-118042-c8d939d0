const { Sequelize } = require('sequelize');
const path = require('path');

// PUBLIC_INTERFACE
/**
 * Returns the Sequelize instance connected to SQLite.
 * @returns {Sequelize}
 */
function getSequelizeInstance() {
  // Use local development SQLite DB
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../database.sqlite'),
    logging: false,
  });
  return sequelize;
}

module.exports = {
  getSequelizeInstance,
};
