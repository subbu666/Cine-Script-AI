const JwtService = require('../services/jwtService');
const User = require('../models/User');
const { UnauthorizedError } = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const auth = async (req, res, next) => {
  try {
    // Extract token from request
    const token = JwtService.extractToken(req);

    if (!token) {
      throw new UnauthorizedError('Access denied. No authentication token provided.');
    }

    // Verify token
    let decoded;
    try {
      decoded = JwtService.verifyToken(token);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new UnauthorizedError('Your session has expired. Please log in again.');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new UnauthorizedError('Invalid authentication token.');
      }
      throw new UnauthorizedError('Authentication failed.');
    }

    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('+password');

    if (!user) {
      throw new UnauthorizedError('User no longer exists.');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Your account has been deactivated.');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedError('Please verify your email before accessing this resource.');
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      userId: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Optional Auth Middleware
 * Attaches user to request if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = JwtService.extractToken(req);

    if (!token) {
      return next();
    }

    const decoded = JwtService.verifyToken(token);
    const user = await User.findById(decoded.userId);

    if (user && user.isActive && user.isEmailVerified) {
      req.user = {
        id: user._id.toString(),
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      };
    }

    next();
  } catch (error) {
    // Silently ignore auth errors for optional auth
    next();
  }
};

/**
 * Admin-only middleware
 * Must be used after auth middleware
 */
const adminOnly = (req, res, next) => {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required.'));
  }

  if (req.user.role !== 'admin') {
    return next(new UnauthorizedError('Admin access required.'));
  }

  next();
};

module.exports = {
  auth,
  optionalAuth,
  adminOnly,
};
