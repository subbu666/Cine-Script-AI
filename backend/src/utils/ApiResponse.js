/**
 * Standardized API Response Format
 * Ensures consistent response structure across all endpoints
 */
class ApiResponse {
  /**
   * Success response
   * @param {Object} options
   * @param {number} options.statusCode - HTTP status code
   * @param {string} options.message - Success message
   * @param {*} options.data - Response data
   * @param {Object} options.meta - Additional metadata (pagination, etc.)
   */
  static success({ statusCode = 200, message = 'Success', data = null, meta = null }) {
    const response = {
      success: true,
      message,
      data,
    };

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Error response
   * @param {Object} options
   * @param {number} options.statusCode - HTTP status code
   * @param {string} options.message - Error message
   * @param {Array} options.errors - Detailed error list
   * @param {string} options.stack - Error stack trace (dev only)
   */
  static error({ statusCode = 500, message = 'Something went wrong', errors = null, stack = null }) {
    const response = {
      success: false,
      message,
    };

    if (errors) {
      response.errors = errors;
    }

    if (stack && process.env.NODE_ENV === 'development') {
      response.stack = stack;
    }

    return response;
  }

  /**
   * Paginated response
   * @param {Object} options
   * @param {Array} options.data - Items array
   * @param {Object} options.pagination - Pagination info
   * @param {string} options.message - Success message
   */
  static paginated({ data, pagination, message = 'Data retrieved successfully' }) {
    return {
      success: true,
      message,
      data,
      meta: {
        pagination,
      },
    };
  }
}

module.exports = ApiResponse;
