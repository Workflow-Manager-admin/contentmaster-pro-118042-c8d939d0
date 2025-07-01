const { sequelize, User, Role } = require('../models');

/**
 * PUBLIC_INTERFACE
 * Script to list *all* users with a specific username, case-insensitive, including soft-deleted.
 * Run with `node src/db/dump_users.js Dmoney`
 */
async function dumpUsersByUsername(targetUsername) {
  try {
    if (!targetUsername) {
      console.error('Usage: node src/db/dump_users.js <username>');
      process.exit(1);
    }
    const users = await User.findAll({
      where: sequelize.where(
        sequelize.fn('lower', sequelize.col('username')),
        targetUsername.toLowerCase()
      ),
      paranoid: false, // include soft-deleted
      include: [{ model: Role }],
    });
    if (!users.length) {
      console.log(`No user(s) found with username: "${targetUsername}" (any case)`);
    } else {
      console.log(`Users matching "${targetUsername}":`);
      for (const u of users) {
        console.log({
          id: u.id,
          username: u.username,
          email: u.email,
          deletedAt: u.deletedAt,
          createdAt: u.createdAt,
          active: u.active,
          role: u.Role ? u.Role.name : undefined,
        });
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('Error during user lookup:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  const name = process.argv[2];
  dumpUsersByUsername(name);
}

module.exports = { dumpUsersByUsername };
