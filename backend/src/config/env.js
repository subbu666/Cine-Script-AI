const path = require("path");

// Load .env from backend directory
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

/**
 * Centralized environment configuration
 * All environment variables are validated and typed here
 */
const env = {
  // Server
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10),
  isDevelopment: process.env.NODE_ENV !== "production",
  isProduction: process.env.NODE_ENV === "production",

  // Client
  clientUrl: process.env.CLIENT_URL,

  // MongoDB
  mongodbUri: process.env.MONGODB_URI,

  // JWT
  jwtSecret: process.env.JWT_SECRET,
  jwtExpire: process.env.JWT_EXPIRE,
  jwtCookieExpire: parseInt(process.env.JWT_COOKIE_EXPIRE, 10),

  // Brevo Email
  brevoApiKey: process.env.BREVO_API_KEY,
  fromEmail: process.env.FROM_EMAIL,
  fromName: process.env.FROM_NAME,

  // Groq AI
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL,

  // Rate Limiting
  otpRateLimitWindowMs: parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS, 10),
  otpRateLimitMaxRequests: parseInt(
    process.env.OTP_RATE_LIMIT_MAX_REQUESTS,
    10,
  ),
  aiRateLimitWindowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 10),
  aiRateLimitMaxRequests: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS, 10),
};

/**
 * Validate required environment variables
 */
const requiredVars = ["mongodbUri", "jwtSecret", "brevoApiKey", "groqApiKey"];

const missingVars = requiredVars.filter((key) => !env[key]);

if (missingVars.length > 0) {
  console.error("\n❌ Missing required environment variables:");
  missingVars.forEach((key) => {
    console.error(`   - ${key}`);
  });
  console.error(
    "\n📝 Please check your backend/.env file or set the environment variables.\n",
  );

  if (env.isProduction) {
    process.exit(1);
  }
}

module.exports = env;
