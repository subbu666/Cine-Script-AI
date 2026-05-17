const express = require("express");
const router = express.Router();

// Controllers
const {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getMe,
  logout,
  refreshToken,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
} = require("../controllers/authController");

// Middlewares
const { validators } = require("../middlewares/validator");
const { auth } = require("../middlewares/auth");
const { otpLimiter, loginLimiter } = require("../middlewares/rateLimiter");

// Validation schemas
const {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyForgotOtpSchema,
  resetPasswordSchema,
} = require("../utils/validators");

/**
 * Auth Routes
 * All authentication-related endpoints
 */

// @route   POST /api/auth/signup
// @desc    Initiate signup, send OTP
// @access  Public
router.post("/signup", validators.body(signupSchema), otpLimiter, signup);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and create account
// @access  Public
router.post("/verify-otp", validators.body(verifyOtpSchema), verifyOtp);

// @route   POST /api/auth/resend-otp
// @desc    Resend signup OTP
// @access  Public
router.post(
  "/resend-otp",
  validators.body(resendOtpSchema),
  otpLimiter,
  resendOtp,
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post("/login", validators.body(loginSchema), loginLimiter, login);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get("/me", auth, getMe);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post("/logout", auth, logout);

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post("/refresh", refreshToken);

/* ------------------------------------------------------------------ */
/*  FORGOT PASSWORD — 3-phase flow                                     */
/* ------------------------------------------------------------------ */

// @route   POST /api/auth/forgot-password
// @desc    Phase 1 — send 6-digit OTP to email
// @access  Public
router.post(
  "/forgot-password",
  validators.body(forgotPasswordSchema),
  otpLimiter, // max 3 requests / 5 min per IP — prevents OTP spam
  forgotPassword,
);

// @route   POST /api/auth/verify-forgot-otp
// @desc    Phase 2 — verify OTP, receive short-lived resetToken
// @access  Public
router.post(
  "/verify-forgot-otp",
  validators.body(verifyForgotOtpSchema),
  verifyForgotOtp,
);

// @route   POST /api/auth/reset-password
// @desc    Phase 3 — set new password using resetToken
// @access  Public
router.post(
  "/reset-password",
  validators.body(resetPasswordSchema),
  resetPassword,
);

module.exports = router;
