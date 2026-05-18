const Script = require("../models/Script");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const GroqService = require("../services/groqService");
const logger = require("../utils/logger");
const {
  BadRequestError,
  NotFoundError,
  InternalServerError,
} = require("../utils/AppError");

/**
 * Script Controller
 * Handles AI script generation, history, section-level regeneration, and sharing
 */

/**
 * @desc   Generate a movie script from a situation
 * @route  POST /api/scripts/generate
 * @access Private
 */
const generateScript = asyncHandler(async (req, res) => {
  const { situation, mood = "dramatic" } = req.body;
  const userId = req.user.id;

  const startTime = Date.now();

  logger.info("Script generation requested", {
    userId,
    mood,
    situation: situation.substring(0, 100),
  });

  let generatedScript;
  try {
    generatedScript = await GroqService.generateScript(situation, mood);
  } catch (error) {
    logger.error("Script generation failed", { userId, error: error.message });
    throw new InternalServerError(
      error.message || "Failed to generate script. Please try again.",
    );
  }

  const script = await Script.create({
    userId,
    situation,
    mood,
    title: generatedScript.title,
    tagline: generatedScript.tagline,
    scenes: generatedScript.scenes,
    generationTime: generatedScript.generationTime || Date.now() - startTime,
  });

  logger.info("Script saved", {
    userId,
    scriptId: script._id,
    title: script.title,
    scenes: script.scenes.length,
    generationTime: script.generationTime,
  });

  res.status(201).json(
    ApiResponse.success({
      message: "Script generated successfully!",
      data: {
        id: script._id,
        title: script.title,
        tagline: script.tagline,
        situation: script.situation,
        mood: script.mood,
        scenes: script.scenes,
        sceneCount: script.scenes.length,
        createdAt: script.createdAt,
        generationTimeMs: script.generationTime,
      },
    }),
  );
});

/**
 * @desc   Regenerate a specific section of an existing script
 * @route  PATCH /api/scripts/:id/regenerate
 * @access Private
 */
const regenerateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { section, sceneNumber } = req.body;
  const userId = req.user.id;

  const VALID_SECTIONS = ["title", "tagline", "scene"];
  if (!section || !VALID_SECTIONS.includes(section)) {
    throw new BadRequestError(
      `Invalid section. Must be one of: ${VALID_SECTIONS.join(", ")}.`,
    );
  }

  if (section === "scene") {
    const num = parseInt(sceneNumber, 10);
    if (!sceneNumber || isNaN(num) || num < 1) {
      throw new BadRequestError(
        "sceneNumber must be a positive integer when section is 'scene'.",
      );
    }
  }

  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  logger.info("Section regeneration requested", {
    userId,
    scriptId: id,
    section,
    sceneNumber: sceneNumber ?? null,
  });

  let regenerated;
  try {
    if (section === "title") {
      regenerated = await GroqService.regenerateSection(
        script.situation,
        script.mood,
        "title",
      );
    } else if (section === "tagline") {
      regenerated = await GroqService.regenerateSection(
        script.situation,
        script.mood,
        "tagline",
        { currentTitle: script.title },
      );
    } else {
      const sceneNum = parseInt(sceneNumber, 10);
      const sceneExists = script.scenes.some((s) => s.number === sceneNum);
      if (!sceneExists) {
        throw new NotFoundError(`Scene ${sceneNum} not found in this script.`);
      }

      const plainScenes = script.scenes.map((s) =>
        s.toObject ? s.toObject() : s,
      );

      regenerated = await GroqService.regenerateSection(
        script.situation,
        script.mood,
        "scene",
        {
          sceneNumber: sceneNum,
          totalScenes: script.scenes.length,
          existingScenes: plainScenes,
        },
      );
    }
  } catch (error) {
    if (error.statusCode) throw error;

    logger.error("Section regeneration AI call failed", {
      userId,
      scriptId: id,
      section,
      error: error.message,
    });
    throw new InternalServerError(
      error.message || "Failed to regenerate section. Please try again.",
    );
  }

  if (section === "title") {
    script.title = regenerated.title;
  } else if (section === "tagline") {
    script.tagline = regenerated.tagline;
  } else {
    const sceneNum = parseInt(sceneNumber, 10);
    const sceneIdx = script.scenes.findIndex((s) => s.number === sceneNum);
    const existingId = script.scenes[sceneIdx]._id;
    script.scenes[sceneIdx] = { ...regenerated.scene, _id: existingId };
    script.markModified("scenes");
  }

  await script.save();

  logger.info("Section regenerated and saved", {
    userId,
    scriptId: id,
    section,
    sceneNumber: sceneNumber ?? null,
  });

  res.status(200).json(
    ApiResponse.success({
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} regenerated successfully`,
      data: {
        id: script._id,
        section,
        title: script.title,
        tagline: script.tagline,
        scenes: script.scenes,
      },
    }),
  );
});

/**
 * @desc   Get user's script history
 * @route  GET /api/scripts/history
 * @access Private
 */
const getHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, mood } = req.query;

  logger.info("Script history requested", { userId, page, limit, mood });

  const result = await Script.getUserHistory(userId, {
    page,
    limit,
    mood: mood || null,
  });

  res.status(200).json(
    ApiResponse.paginated({
      data: result.scripts,
      pagination: result.pagination,
      message: "Script history retrieved successfully",
    }),
  );
});

/**
 * @desc   Get a single script by ID
 * @route  GET /api/scripts/:id
 * @access Private
 */
const getScriptById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  res.status(200).json(
    ApiResponse.success({
      message: "Script retrieved successfully",
      data: {
        id: script._id,
        title: script.title,
        tagline: script.tagline,
        situation: script.situation,
        mood: script.mood,
        scenes: script.scenes,
        sceneCount: script.scenes.length,
        isFavorite: script.isFavorite,
        isPublic: script.isPublic,
        shareToken: script.isPublic ? script.shareToken : undefined,
        createdAt: script.createdAt,
        generationTimeMs: script.generationTime,
      },
    }),
  );
});

/**
 * @desc   Toggle favorite status for a script
 * @route  PATCH /api/scripts/:id/favorite
 * @access Private
 */
const toggleFavorite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  script.isFavorite = !script.isFavorite;
  await script.save();

  res.status(200).json(
    ApiResponse.success({
      message: script.isFavorite
        ? "Script added to favorites"
        : "Script removed from favorites",
      data: { id: script._id, isFavorite: script.isFavorite },
    }),
  );
});

/**
 * @desc   Delete a script
 * @route  DELETE /api/scripts/:id
 * @access Private
 */
const deleteScript = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const script = await Script.findOneAndDelete({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  logger.info("Script deleted", { userId, scriptId: id });

  res.status(200).json(
    ApiResponse.success({
      message: "Script deleted successfully",
      data: { id },
    }),
  );
});

/**
 * @desc   Get script statistics for the user
 * @route  GET /api/scripts/stats
 * @access Private
 */
const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await Script.getUserStats(userId);

  res.status(200).json(
    ApiResponse.success({
      message: "Script statistics retrieved",
      data: {
        totalScripts: stats.totalScripts,
        favoriteScripts: stats.favoriteScripts,
        averageScenesPerScript: Math.round(stats.avgScenes * 10) / 10,
        moodsExplored: stats.moods.length,
        moodBreakdown: stats.moods,
      },
    }),
  );
});

/**
 * @desc   Share a script — generate a public share link token
 * @route  POST /api/scripts/:id/share
 * @access Private
 *
 * If the script already has a shareToken it is reused (stable URL).
 * The script is marked isPublic = true and sharedAt is updated.
 *
 * Response:
 *   { shareToken, shareUrl, isPublic, sharedAt }
 */
const shareScript = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  // Only the owner can share their own script
  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  // ensureShareToken is idempotent — reuses existing token if present
  const token = await script.ensureShareToken();

  // Build the public share URL. The FRONTEND_URL env var should point to
  // the deployed frontend origin (e.g. https://cinescript.app).
  // Falls back to a relative path for local dev.
  const origin = process.env.FRONTEND_URL || "";
  const shareUrl = `${origin}/share/${token}`;

  logger.info("Script shared", {
    userId,
    scriptId: id,
    shareToken: token,
  });

  res.status(200).json(
    ApiResponse.success({
      message: "Share link generated successfully",
      data: {
        shareToken: token,
        shareUrl,
        isPublic: script.isPublic,
        sharedAt: script.sharedAt,
      },
    }),
  );
});

/**
 * @desc   Unshare a script — revoke public access (keeps token for potential re-share)
 * @route  DELETE /api/scripts/:id/share
 * @access Private
 */
const unshareScript = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  script.isPublic = false;
  await script.save();

  logger.info("Script unshared", { userId, scriptId: id });

  res.status(200).json(
    ApiResponse.success({
      message: "Script is now private",
      data: { id: script._id, isPublic: false },
    }),
  );
});

/**
 * @desc   Get a publicly shared script by its share token
 * @route  GET /api/scripts/shared/:token
 * @access Public (no auth required)
 *
 * Only returns the script if isPublic === true.
 * Does NOT expose the owner's userId or internal metadata.
 */
const getSharedScript = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token || token.length !== 32) {
    throw new BadRequestError("Invalid share token.");
  }

  const script = await Script.findOne({
    shareToken: token,
    isPublic: true,
  }).lean();

  if (!script) {
    throw new NotFoundError(
      "This script is not available. It may have been made private or the link is invalid.",
    );
  }

  logger.info("Shared script accessed", {
    scriptId: script._id,
    shareToken: token,
  });

  // Return only public-safe fields — no userId, no internal tokens
  res.status(200).json(
    ApiResponse.success({
      message: "Shared script retrieved successfully",
      data: {
        id: script._id,
        title: script.title,
        tagline: script.tagline,
        mood: script.mood,
        scenes: script.scenes,
        sceneCount: script.scenes.length,
        sharedAt: script.sharedAt,
        createdAt: script.createdAt,
      },
    }),
  );
});

module.exports = {
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
};
