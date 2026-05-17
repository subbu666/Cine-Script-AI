const ApiResponse = require("../utils/ApiResponse");
const { AppError } = require("../utils/AppError");
const env = require("../config/env");
const logger = require("../utils/logger");

/**
 * Mongoose Error Handlers
 * Transforms Mongoose-specific errors into AppError instances
 */

// Handle Mongoose validation errors
// FIX: added guard — err.errors may be undefined if this is a Joi error that
//      slipped through; Object.values(undefined) throws a TypeError.
const handleValidationError = (err) => {
  // Safety guard: if err.errors is missing this is not a Mongoose error
  if (!err.errors || typeof err.errors !== "object") {
    return {
      statusCode: 400,
      message: err.message || "Validation failed",
      errors: null,
    };
  }

  const errors = Object.values(err.errors).map((val) => ({
    field: val.path,
    message: val.message,
    value: val.value,
  }));

  return {
    statusCode: 400,
    message: "Validation failed",
    errors,
  };
};

// Handle Mongoose duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];

  return {
    statusCode: 409,
    message: `${field} '${value}' is already in use`,
    errors: [
      {
        field,
        message: `This ${field} is already registered`,
        value,
      },
    ],
  };
};

// Handle Mongoose cast errors (invalid ObjectId)
const handleCastError = (err) => {
  return {
    statusCode: 400,
    message: `Invalid ${err.path}: ${err.value}`,
    errors: [
      {
        field: err.path,
        message: `Invalid ${err.path} format`,
        value: err.value,
      },
    ],
  };
};

// Handle JWT errors
const handleJWTError = () => {
  return {
    statusCode: 401,
    message: "Invalid authentication token",
  };
};

const handleJWTExpiredError = () => {
  return {
    statusCode: 401,
    message: "Your session has expired. Please log in again.",
  };
};

// Handle Joi validation errors
const handleJoiError = (err) => {
  const errors = err.details.map((detail) => ({
    field: detail.path.join("."),
    message: detail.message.replace(/['"]/g, ""),
    value: detail.context?.value,
  }));

  return {
    statusCode: 400,
    message: "Validation failed",
    errors,
  };
};

/**
 * Global Error Handler Middleware
 * Catches all errors and returns standardized responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let errors = err.errors || null;
  let stack = err.stack || null;

  // Log the error
  logger.error("Error occurred", {
    statusCode,
    message,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id || "anonymous",
    stack: env.isDevelopment ? stack : undefined,
    originalError: {
      name: err.name,
      code: err.code,
      kind: err.kind,
    },
  });

  // Transform specific error types

  // FIX: Check Joi FIRST (err.isJoi) before checking err.name === 'ValidationError'
  // because Joi errors also have name === 'ValidationError', causing the Mongoose
  // handler to run and crash with Object.values(undefined).
  if (err.isJoi || (err.name === "ValidationError" && err.details)) {
    // Joi validation error
    const result = handleJoiError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  }

  // Mongoose Validation Error (has err.errors, not err.details)
  else if (err.name === "ValidationError" && err.errors) {
    const result = handleValidationError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  }

  // Mongoose Duplicate Key Error
  else if (err.code === 11000) {
    const result = handleDuplicateKeyError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  }

  // Mongoose Cast Error
  else if (err.name === "CastError") {
    const result = handleCastError(err);
    statusCode = result.statusCode;
    message = result.message;
    errors = result.errors;
  }

  // JWT Errors
  else if (err.name === "JsonWebTokenError") {
    const result = handleJWTError();
    statusCode = result.statusCode;
    message = result.message;
  } else if (err.name === "TokenExpiredError") {
    const result = handleJWTExpiredError();
    statusCode = result.statusCode;
    message = result.message;
  }

  // Operational errors (expected AppError instances)
  else if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  // Default: 500 Internal Server Error
  else {
    statusCode = 500;
    message = env.isProduction
      ? "Something went wrong. Please try again later."
      : message;
  }

  // Build response
  const response = ApiResponse.error({
    statusCode,
    message,
    errors,
    stack: env.isDevelopment ? stack : undefined,
  });

  res.status(statusCode).json(response);
};

/**
 * 404 Not Found Handler
 * Catches requests to undefined routes
 */
const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Cannot find ${req.method} ${req.originalUrl} on this server`,
    404,
  );
  next(error);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
