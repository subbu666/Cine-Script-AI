const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

/**
 * OTP Schema
 * Temporarily stores OTP codes for both email verification (signup)
 * and password-reset flows. The `purpose` field keeps the two independent
 * so verifying a reset OTP never accidentally consumes a signup OTP and
 * vice-versa.
 *
 * Auto-expires via TTL index after expiresAt timestamp passes.
 */
const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
      index: true,
    },

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // Temporarily stored hashed password.
    // For signup OTPs this is the real (hashed) candidate password.
    // For password-reset OTPs this field is set to 'RESET_PLACEHOLDER'
    // and is never used for authentication.
    password: {
      type: String,
      required: [true, "Password is required"],
    },

    // Hashed OTP code
    otpCode: {
      type: String,
      required: [true, "OTP code is required"],
    },

    // Verification attempts (max 5)
    attempts: {
      type: Number,
      default: 0,
      max: [5, "Maximum verification attempts exceeded"],
    },

    // OTP resend attempts (max 3)
    resendCount: {
      type: Number,
      default: 0,
      max: [3, "Maximum resend attempts exceeded"],
    },

    // OTP expiry timestamp
    expiresAt: {
      type: Date,
      required: true,
    },

    // Verification status
    isVerified: {
      type: Boolean,
      default: false,
    },

    // Distinguishes signup OTPs from password-reset OTPs so the two flows
    // never interfere with each other in the same collection.
    purpose: {
      type: String,
      enum: ["signup", "password-reset"],
      default: "signup",
    },
  },
  {
    timestamps: true,
  },
);

/**
 * TTL Index
 * Automatically deletes expired OTP documents from MongoDB.
 */
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Compound index for faster lookups.
 * Including `purpose` so queries like
 *   { email, purpose: 'password-reset', isVerified: false }
 * hit the index directly instead of scanning all OTPs for an email.
 */
otpSchema.index({ email: 1, purpose: 1, isVerified: 1 });

/**
 * Hash OTP before saving.
 * Only re-hashes when otpCode has been modified (avoids double-hashing on resave).
 */
otpSchema.pre("save", async function () {
  if (!this.isModified("otpCode")) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.otpCode = await bcrypt.hash(this.otpCode, salt);
  } catch (error) {
    throw error;
  }
});

/**
 * Compare a plain-text OTP against the stored hash.
 * @param {string} candidateOtp
 * @returns {Promise<boolean>}
 */
otpSchema.methods.compareOtp = async function (candidateOtp) {
  return await bcrypt.compare(candidateOtp, this.otpCode);
};

/**
 * Check whether this OTP record has passed its expiry time.
 * @returns {boolean}
 */
otpSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/**
 * Check whether the maximum number of verification attempts has been reached.
 * @returns {boolean}
 */
otpSchema.methods.hasMaxAttempts = function () {
  return this.attempts >= 5;
};

/**
 * Check whether the maximum number of resend attempts has been reached.
 * @returns {boolean}
 */
otpSchema.methods.hasMaxResends = function () {
  return this.resendCount >= 3;
};

/**
 * Increment the failed-attempt counter and persist it.
 */
otpSchema.methods.incrementAttempt = async function () {
  this.attempts += 1;
  await this.save();
};

/**
 * Generate a cryptographically random 6-digit OTP.
 * @returns {number}
 */
otpSchema.statics.generateOtp = function () {
  const min = 100000;
  const max = 999999;
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Return a Date 5 minutes from now — the standard OTP lifetime.
 * @returns {Date}
 */
otpSchema.statics.getExpiryTime = function () {
  return new Date(Date.now() + 5 * 60 * 1000);
};

const Otp = mongoose.model("Otp", otpSchema);

module.exports = Otp;
