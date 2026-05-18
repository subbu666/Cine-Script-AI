const Joi = require("joi");

/**
 * Validation Schemas
 * Centralized input validation for all API endpoints
 *
 * MOOD VALUES must match frontend mockScript.ts exactly:
 * "dramatic" | "action" | "comedy" | "romantic" | "tragic"
 */

// User registration validation
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim().messages({
    "string.min": "Name must be at least 2 characters",
    "string.max": "Name cannot exceed 100 characters",
    "any.required": "Name is required",
  }),
  email: Joi.string().email().required().lowercase().trim().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "strong password")
    .messages({
      "string.min": "Password must be at least 6 characters",
      "string.max": "Password cannot exceed 100 characters",
      "string.pattern.name":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "Password is required",
    }),
});

// OTP verification validation (signup flow)
const verifyOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/, "6-digit OTP")
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits",
      "string.pattern.name": "OTP must contain only numbers",
      "any.required": "OTP is required",
    }),
});

// Resend OTP validation (signup flow)
const resendOtpSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
});

// Login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim().messages({
    "string.email": "Please provide a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

// Script generation validation
const generateScriptSchema = Joi.object({
  situation: Joi.string().min(10).max(500).required().trim().messages({
    "string.min": "Situation must be at least 10 characters",
    "string.max": "Situation cannot exceed 500 characters",
    "any.required": "Situation is required",
  }),
  mood: Joi.string()
    .lowercase()
    .valid("dramatic", "action", "comedy", "romantic", "tragic")
    .default("dramatic")
    .messages({
      "any.only":
        "Invalid mood selected. Must be one of: dramatic, action, comedy, romantic, tragic",
    }),
});

// Script history query validation
const scriptHistorySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1).messages({
    "number.base": "Page must be a number",
    "number.min": "Page must be at least 1",
  }),
  limit: Joi.number().integer().min(1).max(50).default(10).messages({
    "number.base": "Limit must be a number",
    "number.min": "Limit must be at least 1",
    "number.max": "Limit cannot exceed 50",
  }),
  mood: Joi.string()
    .lowercase()
    .valid("dramatic", "action", "comedy", "romantic", "tragic")
    .optional()
    .messages({
      "any.only": "Invalid mood filter",
    }),
});

const regenerateSectionSchema = Joi.object({
  section: Joi.string().valid("title", "tagline", "scene").required().messages({
    "any.only": "section must be one of: title, tagline, scene",
    "any.required": "section is required",
  }),
  sceneNumber: Joi.when("section", {
    is: "scene",
    then: Joi.number().integer().min(1).required().messages({
      "any.required": "sceneNumber is required when regenerating a scene",
      "number.min": "sceneNumber must be a positive integer",
    }),
    otherwise: Joi.forbidden().messages({
      "any.unknown": "sceneNumber is only valid when section is 'scene'",
    }),
  }),
});

// Toggle favorite validation
const toggleFavoriteSchema = Joi.object({
  scriptId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/, "MongoDB ObjectId")
    .required()
    .messages({
      "string.pattern.name": "Invalid script ID",
      "any.required": "Script ID is required",
    }),
});

/* ============================================================
 *  FORGOT PASSWORD — 3-phase flow
 * ============================================================ */

// Phase 1 — POST /api/auth/forgot-password { email }
const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
});

// Phase 2 — POST /api/auth/verify-forgot-otp { email, otp }
const verifyForgotOtpSchema = Joi.object({
  email: Joi.string().email().lowercase().trim().required().messages({
    "string.email": "Please provide a valid email address.",
    "any.required": "Email is required.",
  }),
  otp: Joi.string()
    .length(6)
    .pattern(/^\d{6}$/, "6-digit OTP")
    .required()
    .messages({
      "string.length": "OTP must be exactly 6 digits.",
      "string.pattern.name": "OTP must contain only digits.",
      "any.required": "OTP is required.",
    }),
});

// Phase 3 — POST /api/auth/reset-password { resetToken, password }
const resetPasswordSchema = Joi.object({
  resetToken: Joi.string().trim().required().messages({
    "any.required": "Reset token is required.",
  }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "strong password")
    .messages({
      "string.min": "Password must be at least 6 characters.",
      "string.max": "Password cannot exceed 100 characters.",
      "string.pattern.name":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      "any.required": "Password is required.",
    }),
});

module.exports = {
  signupSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  generateScriptSchema,
  scriptHistorySchema,
  toggleFavoriteSchema,
  forgotPasswordSchema,
  verifyForgotOtpSchema,
  resetPasswordSchema,
  regenerateSectionSchema,
};
