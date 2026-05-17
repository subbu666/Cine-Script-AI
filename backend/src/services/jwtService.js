const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * JWT Service
 * Handles token generation, verification, and cookie management.
 *
 * Token types:
 *  - Standard auth token   — issued on login/signup, long-lived (env.jwtExpire)
 *  - Password-reset token  — issued after OTP verification, 10-minute lifetime,
 *                            purpose-scoped so it cannot be used as an auth token
 */
class JwtService {
  /* ------------------------------------------------------------------ */
  /*  STANDARD AUTH TOKENS                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Generate a standard JWT auth token.
   * @param {Object} payload
   * @param {string} payload.userId
   * @param {string} payload.email
   * @param {string} payload.role
   * @returns {string} Signed JWT
   */
  static generateToken(payload) {
    if (!env.jwtSecret) {
      throw new Error("JWT secret is not configured");
    }

    return jwt.sign(payload, env.jwtSecret, {
      expiresIn: env.jwtExpire,
      issuer: "script-alchemy",
      audience: "script-alchemy-users",
    });
  }

  /**
   * Verify a standard auth JWT token.
   * @param {string} token
   * @returns {Object} Decoded token payload
   */
  static verifyToken(token) {
    if (!env.jwtSecret) {
      throw new Error("JWT secret is not configured");
    }

    return jwt.verify(token, env.jwtSecret, {
      issuer: "script-alchemy",
      audience: "script-alchemy-users",
    });
  }

  /**
   * Decode a token without verifying its signature (for inspection only).
   * @param {string} token
   * @returns {Object|null}
   */
  static decodeToken(token) {
    return jwt.decode(token);
  }

  /**
   * Generate a standard auth token and set it as an HTTP-only cookie.
   * @param {Object} res     - Express response object
   * @param {Object} payload - Token payload { userId, email, role }
   * @returns {string} The generated token (also returned in response body)
   */
  static sendToken(res, payload) {
    const token = this.generateToken(payload);

    const cookieOptions = {
      expires: new Date(Date.now() + env.jwtCookieExpire * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? "none" : "lax",
      path: "/",
    };

    res.cookie("token", token, cookieOptions);

    return token;
  }

  /**
   * Clear the auth token cookie (logout).
   * @param {Object} res - Express response object
   */
  static clearToken(res) {
    res.cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      secure: env.isProduction,
      sameSite: env.isProduction ? "none" : "lax",
      path: "/",
    });
  }

  /**
   * Extract a bearer token from the incoming request.
   * Priority: cookies > Authorization header.
   * @param {Object} req - Express request object
   * @returns {string|null}
   */
  static extractToken(req) {
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      return authHeader.substring(7);
    }

    return null;
  }

  /* ------------------------------------------------------------------ */
  /*  PASSWORD-RESET TOKENS                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Issue a short-lived, purpose-scoped reset token.
   *
   * Deliberately does NOT use issuer/audience so the token cannot be
   * accepted by verifyToken() — it can only pass verifyResetToken().
   * This prevents a reset token from ever being used as a login token.
   *
   * @param  {{ email: string }} payload
   * @returns {string} Signed JWT, valid for 10 minutes
   */
  static signResetToken({ email }) {
    if (!env.jwtSecret) {
      throw new Error("JWT secret is not configured");
    }

    return jwt.sign({ email, purpose: "password-reset" }, env.jwtSecret, {
      expiresIn: "10m",
    });
  }

  /**
   * Verify a password-reset token issued by signResetToken().
   *
   * Throws a JsonWebTokenError if:
   *  - The signature is invalid
   *  - The token has expired
   *  - The `purpose` claim is not "password-reset" (e.g. someone passes a
   *    regular auth token hoping to reset a password — rejected)
   *
   * @param  {string} token
   * @returns {{ email: string, purpose: string, iat: number, exp: number }}
   */
  static verifyResetToken(token) {
    if (!env.jwtSecret) {
      throw new Error("JWT secret is not configured");
    }

    // No issuer/audience — matches what signResetToken() produces.
    const decoded = jwt.verify(token, env.jwtSecret);

    if (decoded.purpose !== "password-reset") {
      throw new Error("Token is not a password-reset token.");
    }

    return decoded;
  }
}

module.exports = JwtService;
