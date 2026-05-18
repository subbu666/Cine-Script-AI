#!/usr/bin/env node

const createApp = require("./src/app");
const Database = require("./src/config/database");
const env = require("./src/config/env");
const logger = require("./src/utils/logger");

/**
 * Cine Script AI - Backend Server
 * Entry point that bootstraps the Express application
 */

let server = null;

/**
 * Start the server
 */
const startServer = async () => {
  try {
    console.log("\n");
    console.log(
      "╔═══════════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║                  Cine Script AI BACKEND                       ║",
    );
    console.log(
      "║           AI-Powered Movie Script Generation                  ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════════╝",
    );
    console.log("\n");

    // Connect to MongoDB
    console.log("  [1/3] Connecting to MongoDB Atlas...");
    await Database.connect();

    // Create Express app
    console.log("  [2/3] Initializing Express server...");
    const app = createApp();

    // Start listening
    console.log("  [3/3] Starting server...\n");
    server = app.listen(env.port, () => {
      console.log("✅ Server running successfully!\n");
      console.log(`  🌐 Environment: ${env.nodeEnv}`);
      console.log(`  📡 Port:        ${env.port}`);
      console.log(`  🔗 URL:         http://localhost:${env.port}`);
      console.log(`  📚 API Docs:    http://localhost:${env.port}/api`);
      console.log(`  💻 Client URL:  ${env.clientUrl}`);
      console.log("\n📡 Ready for requests...\n");

      logger.info("Server started", {
        port: env.port,
        env: env.nodeEnv,
      });
    });

    // Handle server errors
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`❌ Port ${env.port} is already in use`);
        logger.error(`Port ${env.port} already in use`);
        process.exit(1);
      }
      logger.error("Server error", { error: error.message });
    });
  } catch (error) {
    console.error("\n❌ Failed to start server:", error.message);
    logger.error("Server startup failed", { error: error.message });
    process.exit(1);
  }
};

/**
 * Graceful shutdown handler
 */
const gracefulShutdown = async (signal) => {
  console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
  logger.info(`${signal} received. Starting graceful shutdown.`);

  if (server) {
    server.close(async () => {
      console.log("  HTTP server closed");

      try {
        await Database.disconnect();
        console.log("✅ Graceful shutdown completed");
        logger.info("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("❌ Error during shutdown:", error.message);
        logger.error("Shutdown error", { error: error.message });
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

// Shutdown signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start the server
startServer();
