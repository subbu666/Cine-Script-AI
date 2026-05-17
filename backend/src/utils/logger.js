const winston = require('winston');
require('winston-daily-rotate-file');
const env = require('../config/env');
const path = require('path');

/**
 * Winston Logger Configuration
 * Logs to console in development, files in production
 * Rotates logs daily
 */

// Log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format (for development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    if (stack) {
      return `[${timestamp}] ${level}: ${message}\n${stack}`;
    }
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// Daily rotate file transport for all logs
const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  level: 'info',
});

// Daily rotate file transport for error logs
const errorFileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(__dirname, '../../logs/error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
});

// Console transport
const consoleTransport = new winston.transports.Console({
  format: env.isDevelopment ? consoleFormat : logFormat,
});

// Create logger
const logger = winston.createLogger({
  level: env.isDevelopment ? 'debug' : 'info',
  format: logFormat,
  defaultMeta: {
    service: 'script-alchemy-backend',
    environment: env.nodeEnv,
  },
  transports: [consoleTransport, fileTransport, errorFileTransport],
  // Don't exit on uncaught errors
  exitOnError: false,
});

/**
 * HTTP request logger stream for Morgan
 */
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  },
};

/**
 * Log unhandled errors
 */
process.on('uncaughtException', (error) => {
  logger.error('UNCAUGHT EXCEPTION', {
    error: error.message,
    stack: error.stack,
  });

  // Graceful shutdown
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('UNHANDLED REJECTION', {
    reason: reason?.message || reason,
    stack: reason?.stack,
  });
});

module.exports = logger;
