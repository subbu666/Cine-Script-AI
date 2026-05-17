const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");

const env = require("./config/env");
const logger = require("./utils/logger");
const requestLogger = require("./middlewares/requestLogger");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const { apiLimiter } = require("./middlewares/rateLimiter");

// Routes
const authRoutes = require("./routes/authRoutes");
const scriptRoutes = require("./routes/scriptRoutes");

/**
 * Express Application Setup
 * Configures middleware, routes, and error handling
 */
const createApp = () => {
  const app = express();

  // ===== Security Middlewares =====

  // Helmet for security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          connectSrc: ["'self'", env.clientUrl],
        },
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  // CORS
  app.use(
    cors({
      origin: env.clientUrl,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
      ],
    }),
  );

  // Parse JSON body
  app.use(
    express.json({
      limit: "10mb",
    }),
  );

  // Parse URL-encoded body
  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );

  // Parse cookies
  app.use(cookieParser());

  // ===== Logging Middleware =====
  app.use(requestLogger);

  // ===== Rate Limiting (General) =====
  if (env.isProduction) {
    app.use("/api/", apiLimiter);
  }

  // ===== Health Check =====
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Script Alchemy API is running",
      data: {
        status: "healthy",
        timestamp: new Date().toISOString(),
        environment: env.nodeEnv,
        version: "1.0.0",
      },
    });
  });

  // ===== Base Route =====
  app.get("/", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Cine Script AI API is Running🔥",
      data: {
        version: "1.0.0",
        docs: "/api",
        health: "/api/health",
      },
    });
  });

  // ===== API Routes =====
  app.use("/api/auth", authRoutes);
  app.use("/api/scripts", scriptRoutes); // FIX: changed from '/api/script' to '/api/scripts'

  // ===== API Documentation Route =====
  app.get("/api", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome to Script Alchemy API",
      data: {
        name: "Script Alchemy API",
        version: "1.0.0",
        description: "AI-powered movie script generation",
        documentation: "/api/docs",
        endpoints: {
          auth: {
            signup: "POST /api/auth/signup",
            verifyOtp: "POST /api/auth/verify-otp",
            resendOtp: "POST /api/auth/resend-otp",
            login: "POST /api/auth/login",
            me: "GET /api/auth/me",
            logout: "POST /api/auth/logout",
            refresh: "POST /api/auth/refresh",
          },
          // FIX: updated all script endpoint paths to use plural '/api/scripts'
          script: {
            generate: "POST /api/scripts/generate",
            history: "GET /api/scripts/history",
            stats: "GET /api/scripts/stats",
            getById: "GET /api/scripts/:id",
            toggleFavorite: "PATCH /api/scripts/:id/favorite",
            delete: "DELETE /api/scripts/:id",
          },
        },
      },
    });
  });

  // ===== 404 Not Found Handler =====
  app.use(notFoundHandler);

  // ===== Global Error Handler =====
  app.use(errorHandler);

  return app;
};

module.exports = createApp;
