const mongoose = require("mongoose");
const crypto = require("crypto");

/**
 * Dialogue Schema (embedded inside each scene)
 */
const dialogueSchema = new mongoose.Schema(
  {
    character: {
      type: String,
      required: true,
      trim: true,
    },
    line: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false },
);

/**
 * Scene Schema (embedded document)
 */
const sceneSchema = new mongoose.Schema(
  {
    number: {
      type: Number,
      required: true,
      min: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    dialogues: {
      type: [dialogueSchema],
      default: [],
    },
  },
  { _id: true },
);

/**
 * Script Schema
 * Stores AI-generated movie scripts
 */
const scriptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    situation: {
      type: String,
      required: [true, "Situation is required"],
      trim: true,
      maxlength: [500, "Situation cannot exceed 500 characters"],
    },
    mood: {
      type: String,
      required: [true, "Mood is required"],
      enum: {
        values: ["dramatic", "comedy", "romantic", "action", "tragic"],
        message: "Invalid mood selected",
      },
      default: "dramatic",
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    tagline: {
      type: String,
      required: [true, "Tagline is required"],
      trim: true,
      maxlength: [300, "Tagline cannot exceed 300 characters"],
    },
    scenes: {
      type: [sceneSchema],
      required: [true, "At least one scene is required"],
      validate: {
        validator: function (scenes) {
          return scenes.length > 0 && scenes.length <= 20;
        },
        message: "Script must have between 1 and 20 scenes",
      },
    },
    generationTime: {
      type: Number, // milliseconds
      default: 0,
    },
    isFavorite: {
      type: Boolean,
      default: false,
    },

    // ── Share feature ────────────────────────────────────────
    /**
     * isPublic: when true the script is accessible via its shareToken
     *           without authentication.
     */
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    /**
     * shareToken: a cryptographically random hex string (16 bytes → 32 chars).
     * Generated on first share; persists so the same URL is stable.
     * Sparse index so documents without a token don't bloat the index.
     */
    shareToken: {
      type: String,
      unique: true,
      sparse: true, // only index documents that have a token
      index: true,
    },
    /**
     * sharedAt: timestamp of the most recent share action.
     * Useful for analytics / expiry logic later.
     */
    sharedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Compound index for user's scripts sorted by creation date
scriptSchema.index({ userId: 1, createdAt: -1 });

// Index for favorite scripts
scriptSchema.index({ userId: 1, isFavorite: 1 });

/**
 * Virtual: scene count
 */
scriptSchema.virtual("sceneCount").get(function () {
  return this.scenes.length;
});

/**
 * Virtual: formatted creation date
 */
scriptSchema.virtual("formattedDate").get(function () {
  return this.createdAt.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
});

/**
 * Instance method: generate and persist a share token.
 * Idempotent — if a token already exists it is reused.
 * Returns the token string.
 */
scriptSchema.methods.ensureShareToken = async function () {
  if (!this.shareToken) {
    this.shareToken = crypto.randomBytes(16).toString("hex");
  }
  this.isPublic = true;
  this.sharedAt = new Date();
  await this.save();
  return this.shareToken;
};

/**
 * Static method to get user's script history
 */
scriptSchema.statics.getUserHistory = async function (userId, options = {}) {
  const { page = 1, limit = 10, mood = null } = options;

  const query = { userId };
  if (mood) query.mood = mood;

  const skip = (page - 1) * limit;

  const [scripts, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(query),
  ]);

  return {
    scripts,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      pages: Math.ceil(total / limit),
      hasNext: skip + scripts.length < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Static method to get script statistics for a user
 */
scriptSchema.statics.getUserStats = async function (userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalScripts: { $sum: 1 },
        favoriteScripts: {
          $sum: { $cond: [{ $eq: ["$isFavorite", true] }, 1, 0] },
        },
        avgScenes: { $avg: { $size: "$scenes" } },
        moods: { $addToSet: "$mood" },
      },
    },
  ]);

  return (
    stats[0] || {
      totalScripts: 0,
      favoriteScripts: 0,
      avgScenes: 0,
      moods: [],
    }
  );
};

const Script = mongoose.model("Script", scriptSchema);

module.exports = Script;
