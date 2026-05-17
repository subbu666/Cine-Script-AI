const mongoose = require('mongoose');
const env = require('./env');

/**
 * MongoDB Atlas Connection
 * Handles connection, disconnection, and error events
 */
class Database {
  constructor() {
    this.connection = null;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    try {
      if (!env.mongodbUri) {
        throw new Error('MongoDB URI is not configured');
      }

      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        bufferCommands: false,
      };

      this.connection = await mongoose.connect(env.mongodbUri, options);

      console.log(`✅ MongoDB Connected: ${this.connection.connection.host}`);
      console.log(`📁 Database: ${this.connection.connection.name}`);

      // Handle connection events
      mongoose.connection.on('error', this.handleError);
      mongoose.connection.on('disconnected', this.handleDisconnect);
      mongoose.connection.on('reconnected', this.handleReconnect);

      return this.connection;
    } catch (error) {
      console.error('❌ MongoDB Connection Failed:', error.message);
      throw error;
    }
  }

  /**
   * Gracefully close the connection
   */
  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('📡 MongoDB Disconnected');
    } catch (error) {
      console.error('Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  /**
   * Handle connection errors
   */
  handleError(error) {
    console.error('MongoDB Error:', error.message);
  }

  /**
   * Handle disconnection
   */
  handleDisconnect() {
    console.warn('⚠️ MongoDB Disconnected. Attempting to reconnect...');
  }

  /**
   * Handle reconnection
   */
  handleReconnect() {
    console.log('✅ MongoDB Reconnected');
  }
}

// Export singleton instance
module.exports = new Database();
