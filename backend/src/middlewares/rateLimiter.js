const rateLimit = require('express-rate-limit');
const env = require('../config/env');

/**
 * Rate Limiting Middleware
 * Prevents brute force attacks and API abuse
 */

// Helper to get client identifier safely (handles IPv4/IPv6)
const getClientId = (req) => {
  // Use email from body if available
  if (req.body?.email) {
    return req.body.email;
  }
  // Fallback to IP with IPv6 normalization
  return req.ip?.replace(/:/g, '_') || 'unknown';
};

// OTP rate limiter - strict limits for OTP endpoints
const otpLimiter = rateLimit({
  windowMs: env.otpRateLimitWindowMs,
  max: env.otpRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientId,
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      success: false,
      message: `Too many OTP requests. Please try again after ${Math.ceil(retryAfter / 60)} minutes.`,
      meta: {
        retryAfter,
        limit: options.max,
        window: `${Math.ceil(options.windowMs / 60000)} minutes`,
      },
    });
  },
  skip: () => env.isDevelopment, // Skip in development
});

// AI generation rate limiter - moderate limits
const aiLimiter = rateLimit({
  windowMs: env.aiRateLimitWindowMs,
  max: env.aiRateLimitMaxRequests,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by user ID if authenticated, otherwise by normalized IP
    return req.user?.id || req.ip?.replace(/:/g, '_') || 'unknown';
  },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.status(429).json({
      success: false,
      message: `Too many AI generation requests. Please try again after ${retryAfter} seconds.`,
      meta: {
        retryAfter,
        limit: options.max,
        window: `${Math.ceil(options.windowMs / 1000)} seconds`,
      },
    });
  },
  skip: () => env.isDevelopment,
});

// General API rate limiter - generous limits
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please slow down.',
    });
  },
  skip: () => env.isDevelopment,
});

// Login rate limiter - prevent brute force
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: getClientId,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many login attempts. Please try again after 15 minutes.',
    });
  },
  skip: () => env.isDevelopment,
});

module.exports = {
  otpLimiter,
  aiLimiter,
  apiLimiter,
  loginLimiter,
};
