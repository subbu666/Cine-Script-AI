const express = require("express");
const router = express.Router();

// Controllers
const {
  generateScript,
  getHistory,
  getScriptById,
  toggleFavorite,
  deleteScript,
  getStats,
} = require("../controllers/scriptController");

// Middlewares
const { validators } = require("../middlewares/validator");
const { auth } = require("../middlewares/auth");
const { aiLimiter } = require("../middlewares/rateLimiter");

// Validation schemas
const {
  generateScriptSchema,
  scriptHistorySchema,
  toggleFavoriteSchema,
} = require("../utils/validators");

/**
 * Script Routes
 * All script generation and history endpoints
 * Base path: /api/scripts
 */

// @route   POST /api/scripts/generate
// @desc    Generate a movie script
// @access  Private
router.post(
  "/generate",
  auth,
  aiLimiter,
  validators.body(generateScriptSchema),
  generateScript,
);

// @route   GET /api/scripts/history
// @desc    Get user's script history
// @access  Private
router.get("/history", auth, validators.query(scriptHistorySchema), getHistory);

// @route   GET /api/scripts/stats
// @desc    Get user's script statistics
// @access  Private
router.get("/stats", auth, getStats);

// @route   GET /api/scripts/:id
// @desc    Get a single script
// @access  Private
router.get("/:id", auth, getScriptById);

// @route   PATCH /api/scripts/:id/favorite
// @desc    Toggle favorite status
// @access  Private
router.patch("/:id/favorite", auth, toggleFavorite);

// @route   DELETE /api/scripts/:id
// @desc    Delete a script
// @access  Private
router.delete("/:id", auth, deleteScript);

module.exports = router;
