const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Standardized on MONGODB_URI (matching every other repo in the portfolio —
// server.js previously read MONGO_URI, which config.env never actually
// defined, so the connection silently used undefined).
async function connectDB() {
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
  });

  logger.info('Mongoose connected to DB');

  mongoose.connection.on('error', (err) => {
    logger.error(`Mongoose connection error: ${err}`);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('Mongoose disconnected from DB');
  });
}

module.exports = { connectDB };
