const User = require("../models/User");
const Otp = require("../models/Otp");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const EmailService = require("../services/emailService");
const JwtService = require("../services/jwtService");
const logger = require("../utils/logger");
const {
  BadRequestError,
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  TooManyRequestsError,
  InternalServerError,
} = require("../utils/AppError");

/**
 * Auth Controller
 * Handles authentication: signup, OTP verification, resend OTP, login, profile,
 * forgot-password (request OTP → verify OTP → reset password).
 */

/* ================================================================
 *  SIGNUP
 * ================================================================ */
const signup = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ConflictError(
      existingUser.isEmailVerified
        ? "An account with this email already exists. Please log in."
        : "An account with this email exists but is not verified. Please verify your email or resend OTP.",
    );
  }

  await Otp.deleteMany({ email, isVerified: false });

  const otpCode = Otp.generateOtp();
  const expiryTime = Otp.getExpiryTime();

  await Otp.create({
    email,
    name,
    password,
    otpCode,
    expiresAt: expiryTime,
    attempts: 0,
    resendCount: 0,
  });

  logger.info("OTP record created", { email, expiresAt: expiryTime });

  try {
    await EmailService.sendOtpEmail({
      to: email,
      name,
      otp: otpCode.toString(),
      expiryMinutes: 5,
    });
    logger.info("OTP email sent", { email });
  } catch (emailError) {
    logger.error("Failed to send OTP email", {
      email,
      error: emailError.message,
      otpCode,
    });

    if (process.env.NODE_ENV === "development") {
      return res.status(200).json(
        ApiResponse.success({
          message: "Signup initiated. Check your email for OTP.",
          data: { email, expiresAt: expiryTime, otp: otpCode.toString() },
          meta: {
            warning: "Email service unavailable. OTP shown for testing only.",
          },
        }),
      );
    }

    throw new InternalServerError(
      "Failed to send verification email. Please try again.",
    );
  }

  res.status(200).json(
    ApiResponse.success({
      message: "Signup initiated. Check your email for the verification code.",
      data: { email, expiresAt: expiryTime },
    }),
  );
});

/* ================================================================
 *  VERIFY OTP  (signup flow)
 * ================================================================ */
const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await Otp.findOne({ email, isVerified: false });

  if (!otpRecord) {
    throw new BadRequestError(
      "No pending verification found for this email. Please sign up again.",
    );
  }

  if (otpRecord.isExpired()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new BadRequestError(
      "Verification code has expired. Please request a new one.",
    );
  }

  if (otpRecord.hasMaxAttempts()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new TooManyRequestsError(
      "Maximum verification attempts exceeded. Please sign up again.",
    );
  }

  const isValid = await otpRecord.compareOtp(otp);

  if (!isValid) {
    await otpRecord.incrementAttempt();
    const remainingAttempts = 5 - otpRecord.attempts;
    throw new BadRequestError(
      `Invalid verification code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? "s" : ""} remaining.`,
    );
  }

  const user = await User.create({
    name: otpRecord.name,
    email: otpRecord.email,
    password: otpRecord.password,
    isEmailVerified: true,
  });

  otpRecord.isVerified = true;
  await otpRecord.save();

  logger.info("User created after OTP verification", {
    userId: user._id,
    email,
  });

  const token = JwtService.sendToken(res, {
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  EmailService.sendWelcomeEmail({ to: user.email, name: user.name }).catch(
    (err) => {
      logger.error("Welcome email failed", { email, error: err.message });
    },
  );

  res.status(201).json(
    ApiResponse.success({
      message: "Account verified successfully! Welcome to Script Alchemy.",
      data: { user: user.toPublicProfile(), token },
    }),
  );
});

/* ================================================================
 *  RESEND OTP  (signup flow)
 * ================================================================ */
const resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const existingRecord = await Otp.findOne({ email, isVerified: false });

  if (!existingRecord) {
    throw new BadRequestError(
      "No pending verification found for this email. Please sign up again.",
    );
  }

  if (existingRecord.hasMaxResends()) {
    await Otp.deleteOne({ _id: existingRecord._id });
    throw new TooManyRequestsError(
      "Maximum resend attempts exceeded. Please sign up again.",
    );
  }

  const newOtpCode = Otp.generateOtp();
  const newExpiry = Otp.getExpiryTime();

  existingRecord.otpCode = newOtpCode.toString();
  existingRecord.expiresAt = newExpiry;
  existingRecord.resendCount += 1;
  existingRecord.attempts = 0;
  await existingRecord.save();

  logger.info("OTP resent", { email, resendCount: existingRecord.resendCount });

  try {
    await EmailService.sendOtpEmail({
      to: email,
      name: existingRecord.name,
      otp: newOtpCode.toString(),
      expiryMinutes: 5,
    });
  } catch (emailError) {
    logger.error("Failed to resend OTP email", {
      email,
      error: emailError.message,
    });

    if (process.env.NODE_ENV === "development") {
      return res.status(200).json(
        ApiResponse.success({
          message: "New verification code generated.",
          data: { email, expiresAt: newExpiry, otp: newOtpCode.toString() },
        }),
      );
    }

    throw new InternalServerError(
      "Failed to send verification email. Please try again.",
    );
  }

  res.status(200).json(
    ApiResponse.success({
      message: "New verification code sent to your email.",
      data: { email, expiresAt: newExpiry },
    }),
  );
});

/* ================================================================
 *  LOGIN
 * ================================================================ */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");

  if (!user) throw new UnauthorizedError("Invalid email or password.");
  if (!user.isEmailVerified)
    throw new UnauthorizedError("Please verify your email before logging in.");
  if (!user.isActive)
    throw new UnauthorizedError(
      "Your account has been deactivated. Please contact support.",
    );

  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid)
    throw new UnauthorizedError("Invalid email or password.");

  user.lastLogin = new Date();
  await user.save();

  logger.info("User logged in", { userId: user._id, email });

  const token = JwtService.sendToken(res, {
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json(
    ApiResponse.success({
      message: "Login successful!",
      data: { user: user.toPublicProfile(), token },
    }),
  );
});

/* ================================================================
 *  GET ME
 * ================================================================ */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) throw new NotFoundError("User not found.");

  res.status(200).json(
    ApiResponse.success({
      message: "Profile retrieved successfully",
      data: { user: user.toPublicProfile() },
    }),
  );
});

/* ================================================================
 *  LOGOUT
 * ================================================================ */
const logout = asyncHandler(async (req, res) => {
  JwtService.clearToken(res);
  logger.info("User logged out", { userId: req.user?.id });

  res
    .status(200)
    .json(
      ApiResponse.success({ message: "Logged out successfully.", data: null }),
    );
});

/* ================================================================
 *  REFRESH TOKEN
 * ================================================================ */
const refreshToken = asyncHandler(async (req, res) => {
  const token = JwtService.extractToken(req);
  if (!token) throw new UnauthorizedError("No token provided.");

  const decoded = JwtService.verifyToken(token);
  const user = await User.findById(decoded.userId);

  if (!user || !user.isActive) throw new UnauthorizedError("Invalid token.");

  const newToken = JwtService.sendToken(res, {
    userId: user._id,
    email: user.email,
    role: user.role,
  });

  res.status(200).json(
    ApiResponse.success({
      message: "Token refreshed successfully",
      data: { token: newToken, user: user.toPublicProfile() },
    }),
  );
});

/* ================================================================
 *  FORGOT PASSWORD — Phase 1
 *  POST /api/auth/forgot-password  { email }
 *  Finds the user, generates a password-reset OTP, sends it via email.
 *  We re-use the Otp model but set `purpose: 'password-reset'` so it
 *  never collides with a pending signup OTP for the same address.
 * ================================================================ */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Always respond with 200 even when the email is unknown —
  // prevents account enumeration.
  const user = await User.findOne({ email, isEmailVerified: true });

  if (!user) {
    // Generic response — do NOT reveal that the email doesn't exist.
    return res.status(200).json(
      ApiResponse.success({
        message:
          "If an account with that email exists, a reset code has been sent.",
        data: { ok: true },
      }),
    );
  }

  // Remove any existing password-reset OTP for this email.
  await Otp.deleteMany({ email, purpose: "password-reset", isVerified: false });

  const otpCode = Otp.generateOtp();
  const expiryTime = Otp.getExpiryTime(); // 5 min, same as signup OTP

  // Store with purpose flag so signup & reset OTPs are independent.
  await Otp.create({
    email,
    name: user.name,
    // `password` field is required by the Otp schema (it stores the
    // hashed password for signup).  For password-reset we have no new
    // password yet, so we store a placeholder that is never used.
    password: "RESET_PLACEHOLDER",
    otpCode,
    expiresAt: expiryTime,
    attempts: 0,
    resendCount: 0,
    purpose: "password-reset",
  });

  logger.info("Password-reset OTP created", { email, expiresAt: expiryTime });

  try {
    await EmailService.sendForgotPasswordOtpEmail({
      to: email,
      name: user.name,
      otp: otpCode.toString(),
      expiryMinutes: 5,
    });
    logger.info("Password-reset OTP email sent", { email });
  } catch (emailError) {
    logger.error("Failed to send password-reset OTP email", {
      email,
      error: emailError.message,
    });

    if (process.env.NODE_ENV === "development") {
      return res.status(200).json(
        ApiResponse.success({
          message: "Password reset OTP generated.",
          data: { ok: true, devOtp: otpCode.toString() },
          meta: {
            warning: "Email service unavailable. OTP shown for dev only.",
          },
        }),
      );
    }

    throw new InternalServerError(
      "Failed to send reset email. Please try again.",
    );
  }

  res.status(200).json(
    ApiResponse.success({
      message: "A 6-digit reset code has been sent to your email.",
      data: { ok: true },
    }),
  );
});

/* ================================================================
 *  FORGOT PASSWORD — Phase 2
 *  POST /api/auth/verify-forgot-otp  { email, otp }
 *  Verifies the password-reset OTP and returns a short-lived resetToken
 *  (a signed JWT, valid for 10 minutes, scoped to password-reset only).
 * ================================================================ */
const verifyForgotOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const otpRecord = await Otp.findOne({
    email,
    purpose: "password-reset",
    isVerified: false,
  });

  if (!otpRecord) {
    throw new BadRequestError(
      "No pending reset request found. Please request a new reset code.",
    );
  }

  if (otpRecord.isExpired()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new BadRequestError(
      "Reset code has expired. Please request a new one.",
    );
  }

  if (otpRecord.hasMaxAttempts()) {
    await Otp.deleteOne({ _id: otpRecord._id });
    throw new TooManyRequestsError(
      "Maximum attempts exceeded. Please request a new reset code.",
    );
  }

  const isValid = await otpRecord.compareOtp(otp);

  if (!isValid) {
    await otpRecord.incrementAttempt();
    const remaining = 5 - otpRecord.attempts;
    throw new BadRequestError(
      `Invalid reset code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`,
    );
  }

  // Mark OTP consumed so it cannot be reused.
  otpRecord.isVerified = true;
  await otpRecord.save();

  // Issue a short-lived, purpose-scoped reset token.
  // We sign it with the main JWT_SECRET but embed a `purpose` claim so
  // the resetPassword handler can reject tokens from regular logins.
  const resetToken = JwtService.signResetToken({ email });

  logger.info("Forgot-password OTP verified", { email });

  res.status(200).json(
    ApiResponse.success({
      message: "OTP verified. You may now set a new password.",
      data: { resetToken },
    }),
  );
});

/* ================================================================
 *  FORGOT PASSWORD — Phase 3
 *  POST /api/auth/reset-password  { resetToken, password }
 *  Verifies the reset token, updates the user's password.
 * ================================================================ */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, password } = req.body;

  // Verify the token is genuine and purpose-scoped.
  let decoded;
  try {
    decoded = JwtService.verifyResetToken(resetToken);
  } catch {
    throw new BadRequestError(
      "Invalid or expired reset link. Please start over.",
    );
  }

  const user = await User.findOne({
    email: decoded.email,
    isEmailVerified: true,
  }).select("+password");

  if (!user) throw new NotFoundError("User not found.");
  if (!user.isActive)
    throw new UnauthorizedError("Account is deactivated. Contact support.");

  // Prevent reuse of the same password (optional but good UX).
  const isSamePassword = await user.comparePassword(password);
  if (isSamePassword) {
    throw new BadRequestError(
      "New password must be different from your current password.",
    );
  }

  // Assign; the pre-save hook on User will hash it.
  user.password = password;
  await user.save();

  logger.info("Password reset successfully", {
    userId: user._id,
    email: decoded.email,
  });

  res.status(200).json(
    ApiResponse.success({
      message:
        "Password reset successfully. You can now log in with your new password.",
      data: { ok: true },
    }),
  );
});

module.exports = {
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
};
