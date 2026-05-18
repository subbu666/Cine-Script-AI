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
 * Handles AI script generation, history, and section-level regeneration
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
 *         Supported sections: 'title' | 'tagline' | 'scene'
 * @route  PATCH /api/scripts/:id/regenerate
 * @access Private
 *
 * Body:
 *   { section: 'title' | 'tagline' | 'scene', sceneNumber?: number }
 */
const regenerateSection = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { section, sceneNumber } = req.body;
  const userId = req.user.id;

  // ── Input validation ────────────────────────────────────────
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

  // ── Fetch script (ownership enforced) ───────────────────────
  const script = await Script.findOne({ _id: id, userId });
  if (!script) throw new NotFoundError("Script not found.");

  logger.info("Section regeneration requested", {
    userId,
    scriptId: id,
    section,
    sceneNumber: sceneNumber ?? null,
  });

  // ── Call AI service ─────────────────────────────────────────
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
      // section === 'scene'
      const sceneNum = parseInt(sceneNumber, 10);
      const sceneExists = script.scenes.some((s) => s.number === sceneNum);
      if (!sceneExists) {
        throw new NotFoundError(`Scene ${sceneNum} not found in this script.`);
      }

      // Convert Mongoose subdocuments to plain objects for the prompt builder
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
    // Re-throw domain errors (NotFoundError, BadRequestError) as-is
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

  // ── Patch the script document ────────────────────────────────
  if (section === "title") {
    script.title = regenerated.title;
  } else if (section === "tagline") {
    script.tagline = regenerated.tagline;
  } else {
    // section === 'scene' — replace the matching scene in the array
    const sceneNum = parseInt(sceneNumber, 10);
    const sceneIdx = script.scenes.findIndex((s) => s.number === sceneNum);

    // Preserve the Mongoose subdocument _id so the DB record stays stable
    const existingId = script.scenes[sceneIdx]._id;
    script.scenes[sceneIdx] = { ...regenerated.scene, _id: existingId };

    // Explicitly mark the array as modified so Mongoose persists the change
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
        // Always return title + tagline so the frontend can update both fields
        // without an extra round-trip, and the full scenes array for the scene case.
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

module.exports = {
  generateScript,
  regenerateSection,
  getHistory,
  getScriptById,
  toggleFavorite,
  deleteScript,
  getStats,
};
