const mongoose = require('mongoose');
const logger = require('../utils/logger');

// MongoDB connection class
class Database {
  constructor() {
    this._connect();
  }

  async _connect() {
    try {
      // Set mongoose options
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10, // Maintain up to 10 socket connections
      };

      // Connect to MongoDB - using MONGODB_URI which is more standard
      await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, options);
      
      logger.info('Database connection established successfully');
      
      // Connection events
      mongoose.connection.on('connected', () => {
        logger.info('Mongoose connected to DB');
      });

      mongoose.connection.on('error', (err) => {
        logger.error(`Mongoose connection error: ${err}`);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('Mongoose disconnected from DB');
      });

      // Close the Mongoose connection when the application terminates
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('Mongoose connection closed due to app termination');
        process.exit(0);
      });

    } catch (err) {
      logger.error('Database connection error:', err);
      // Exit process with failure
      process.exit(1);
    }
  }

  // Method to get the Mongoose connection status
  getStatus() {
    return {
      state: mongoose.connection.readyState,
      stateName: this._getStateName(mongoose.connection.readyState),
      models: mongoose.modelNames(),
      host: mongoose.connection?.host,
      port: mongoose.connection?.port,
      name: mongoose.connection?.name,
    };
  }

  // Helper method to translate readyState to string
  _getStateName(state) {
    switch (state) {
      case 0: return 'disconnected';
      case 1: return 'connected';
      case 2: return 'connecting';
      case 3: return 'disconnecting';
      default: return 'unknown';
    }
  }

  // Method to ping the database
  async ping() {
    try {
      await mongoose.connection.db.admin().ping();
      return { ok: 1 };
    } catch (err) {
      logger.error('Database ping failed:', err);
      throw err;
    }
  }
}

// Export both the class and a singleton instance
module.exports = {
  Database,
  connectDB: new Database()
};

