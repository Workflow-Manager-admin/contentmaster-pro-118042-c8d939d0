const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// JWT secret and expiry from environment or defaults
const JWT_SECRET = process.env.JWT_SECRET || 'changeme_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Util: create JWT token payload
function generateToken(user, roleName) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, role: roleName },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// PUBLIC_INTERFACE
/**
 * AuthService: logic for signup, login, and role assignment.
 */
class AuthService {
  // PUBLIC_INTERFACE
  /**
   * Register a new user.
   * @param {Object} params - username, email, password, role
   */
  async signup({ username, email, password, role }) {
    // Validate presence
    if (!username || !email || !password || !role)
      throw new Error('Missing required fields');
    const roleObj = await Role.findOne({ where: { name: role } });
    if (!roleObj) throw new Error('Invalid role');
    // Check softly regardless of string case - disallow re-register if username exists (case-insensitive) and is active
    const { Op } = User.sequelize;
    // Find active (not soft-deleted) user with username/email, case-insensitive
    const existingActive = await User.findOne({
      where: { 
        [Op.or]: [
          // Postgres: use Op.iLike, SQLite fallback: lower field and value comparison
          User.sequelize.where(
            User.sequelize.fn('lower', User.sequelize.col('username')),
            User.sequelize.fn('lower', username)
          ),
          User.sequelize.where(
            User.sequelize.fn('lower', User.sequelize.col('email')),
            User.sequelize.fn('lower', email)
          ),
        ],
        deletedAt: null, // Only consider active users
      }
    });
    if (existingActive) {
      // Check match (case-insensitive)
      if (existingActive.username.toLowerCase() === username.toLowerCase()) {
        throw new Error('Username is already taken');
      } else if (existingActive.email.toLowerCase() === email.toLowerCase()) {
        throw new Error('Email is already in use');
      } else {
        throw new Error('User with given username or email already exists');
      }
    }
    // Soft-deleted or purged users do NOT block re-registration
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({
        username,
        email,
        password: passwordHash,
        roleId: roleObj.id,
        displayName: username
      });
      // Omit password in plain object
      const { password: omitted, ...userObj } = user.get({ plain: true });
      return userObj;
    } catch (err) {
      // Defensive: catch unique-constraint errors in case DB constraint fires first
      if (err.name === 'SequelizeUniqueConstraintError') {
        const msg = (err.fields && err.fields.username)
          ? 'Username is already taken'
          : (err.fields && err.fields.email)
            ? 'Email is already in use'
            : 'User with given username or email already exists';
        throw new Error(msg);
      }
      throw err;
    }
  }

  // PUBLIC_INTERFACE
  /**
   * Login and receive JWT.
   * @param {Object} params - usernameOrEmail, password
   */
  async login({ usernameOrEmail, password }) {
    if (!usernameOrEmail || !password)
      throw new Error('Missing credentials');
    // Allow login via username or email
    const user = await User.findOne({
      where: {
        [User.sequelize.Op.or]: [
          { username: usernameOrEmail },
          { email: usernameOrEmail }
        ]
      },
      include: [{ model: Role }]
    });
    if (!user || !user.password)
      throw new Error('Invalid username/email or password');
    if (!(await bcrypt.compare(password, user.password)))
      throw new Error('Invalid username/email or password');
    if (user.active === false)
      throw new Error('Account is deactivated');
    const token = generateToken(user, user.Role ? user.Role.name : null);
    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        role: user.Role ? user.Role.name : null
      },
    };
  }

  // PUBLIC_INTERFACE
  /**
   * Assign/Update a user's role (admin only).
   * @param {Object} params - userId, role, requester (user object from middleware)
   */
  async assignRole({ userId, role, requester }) {
    if (!requester || !requester.role || requester.role !== 'admin')
      throw new Error('Only admin can assign roles');
    const roleObj = await Role.findOne({ where: { name: role } });
    if (!roleObj) throw new Error('Role does not exist');
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    user.roleId = roleObj.id;
    await user.save();
    return;
  }
}

module.exports = new AuthService();
