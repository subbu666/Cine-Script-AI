/**
 * Async Handler Wrapper
 * Eliminates need for try-catch in every controller
 * Automatically catches errors and passes to Express error handler
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
