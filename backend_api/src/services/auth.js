const { User, Role } = require('../models');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op, fn, col, where } = require('sequelize');

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
    console.log('[AuthService] Signup attempt:', { username, email, role, hasPassword: !!password });
    
    // Enhanced validation with specific error messages
    const validationErrors = [];
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      validationErrors.push('Username is required and must be a non-empty string');
    }
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      validationErrors.push('Email is required and must be a non-empty string');
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      validationErrors.push('Password is required and must be at least 6 characters long');
    }
    if (!role || typeof role !== 'string' || role.trim().length === 0) {
      validationErrors.push('Role is required and must be a non-empty string');
    }
    
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      validationErrors.push('Email format is invalid');
    }
    
    if (validationErrors.length > 0) {
      console.log('[AuthService] Validation errors:', validationErrors);
      throw new Error(validationErrors.join('; '));
    }

    // Trim inputs
    username = username.trim();
    email = email.trim().toLowerCase();
    role = role.trim();

    // Validate role exists
    const roleObj = await Role.findOne({ where: { name: role } });
    if (!roleObj) {
      console.log('[AuthService] Invalid role provided:', role);
      const availableRoles = await Role.findAll({ attributes: ['name'] });
      const roleNames = availableRoles.map(r => r.name).join(', ');
      throw new Error(`Invalid role. Available roles: ${roleNames}`);
    }

    console.log('[AuthService] Role validation passed:', role);

    // Check for existing users (case-insensitive)
    const existingActive = await User.findOne({
      where: { 
        [Op.or]: [
          where(fn('lower', col('username')), username.toLowerCase()),
          where(fn('lower', col('email')), email.toLowerCase()),
        ],
        deletedAt: null, // Only consider active users
      }
    });

    if (existingActive) {
      console.log('[AuthService] User conflict detected:', {
        existingUsername: existingActive.username,
        existingEmail: existingActive.email,
        attemptedUsername: username,
        attemptedEmail: email
      });

      // Check specific conflict type
      if (existingActive.username.toLowerCase() === username.toLowerCase()) {
        throw new Error('Username is already taken');
      } else if (existingActive.email.toLowerCase() === email.toLowerCase()) {
        throw new Error('Email is already in use');
      } else {
        throw new Error('User with given username or email already exists');
      }
    }

    console.log('[AuthService] No user conflicts found, proceeding with user creation');

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    try {
      const user = await User.create({
        username,
        email,
        password: passwordHash,
        roleId: roleObj.id,
        displayName: username
      });

      console.log('[AuthService] User created successfully:', { 
        id: user.id, 
        username: user.username, 
        email: user.email 
      });

      // Omit password in response
      const { password: omitted, ...userObj } = user.get({ plain: true });
      return userObj;
    } catch (err) {
      console.error('[AuthService] Error during user creation:', err);
      
      // Handle database constraint errors
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
        [Op.or]: [
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
