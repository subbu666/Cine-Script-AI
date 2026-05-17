const morgan = require('morgan');
const logger = require('../utils/logger');
const env = require('../config/env');

/**
 * HTTP Request Logger Middleware
 * Uses Morgan for HTTP logging with Winston stream
 */

// Morgan format string
// :remote-addr :method :url :status :response-time ms - :res[content-length]
const morganFormat = env.isDevelopment
  ? 'dev' // Concise colored format for development
  : ':remote-addr - :method :url :status :response-time ms :res[content-length] bytes - :user-agent';

// Custom token for user ID
morgan.token('userId', (req) => {
  return req.user?.id || 'anonymous';
});

// Custom token for request body (in dev only)
morgan.token('body', (req) => {
  if (env.isDevelopment && req.body && Object.keys(req.body).length > 0) {
    // Mask sensitive fields
    const sanitized = { ...req.body };
    if (sanitized.password) sanitized.password = '***';
    if (sanitized.otp) sanitized.otp = '***';
    return JSON.stringify(sanitized);
  }
  return '-';
});

// Custom format for production
const customProductionFormat =
  ':remote-addr [:date[iso]] ":method :url HTTP/:http-version" :status :response-time ms - :res[content-length] bytes "user: :userId"';

const requestLogger = morgan(
  env.isDevelopment ? morganFormat : customProductionFormat,
  {
    stream: logger.stream,
    skip: (req, res) => {
      // Skip health check logs in production to reduce noise
      if (env.isProduction && req.path === '/api/health') {
        return true;
      }
      return false;
    },
  }
);

module.exports = requestLogger;
