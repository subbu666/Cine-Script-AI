const express = require("express");
const router = express.Router();

// Controllers
const {
  generateScript,
  regenerateSection,
  getHistory,
  getScriptById,
  toggleFavorite,
  deleteScript,
  getStats,
  shareScript,
  unshareScript,
  getSharedScript,
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
  regenerateSectionSchema,
} = require("../utils/validators");

/**
 * Script Routes
 * All script generation and history endpoints
 * Base path: /api/scripts
 */

// ─── Public routes (no auth) ───────────────────────────────────────────────

// @route   GET /api/scripts/shared/:token
// @desc    Get a publicly shared script via its share token
// @access  Public
// NOTE: This route MUST be declared before /:id so Express doesn't treat
//       "shared" as a MongoDB ObjectId.
router.get("/shared/:token", getSharedScript);

// ─── Authenticated routes ──────────────────────────────────────────────────

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

// @route   PATCH /api/scripts/:id/regenerate
// @desc    Regenerate a specific section of an existing script
// @access  Private
router.patch(
  "/:id/regenerate",
  auth,
  aiLimiter,
  validators.body(regenerateSectionSchema),
  regenerateSection,
);

// @route   POST /api/scripts/:id/share
// @desc    Generate a public share link for a script (idempotent)
// @access  Private
router.post("/:id/share", auth, shareScript);

// @route   DELETE /api/scripts/:id/share
// @desc    Revoke public access to a script
// @access  Private
router.delete("/:id/share", auth, unshareScript);

// @route   DELETE /api/scripts/:id
// @desc    Delete a script
// @access  Private
router.delete("/:id", auth, deleteScript);

module.exports = router;
