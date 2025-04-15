const winston = require('winston');
const { combine, timestamp, printf, colorize, align, errors } = winston.format;
const path = require('path');
const fs = require('fs');
const DailyRotateFile = require('winston-daily-rotate-file');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Custom log format
const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

// Base logger configuration
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: combine(
    errors({ stack: true }), // Include stack traces for errors
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    align(),
    logFormat
  ),
  transports: [
    // Console transport (colored output)
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        logFormat
      ),
      handleExceptions: true
    }),
    // Daily rotating file transport for errors
    new DailyRotateFile({
      level: 'error',
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      handleExceptions: true
    }),
    // Daily rotating file transport for all logs
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d'
    })
  ],
  exitOnError: false
});

// Create a stream for morgan (HTTP request logging)
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

// Add a method for API-specific logging
logger.apiLog = (req, res, error = null) => {
  const logData = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    user: req.user ? req.user.id : 'anonymous',
    status: res.statusCode,
    responseTime: req.responseTime ? `${req.responseTime}ms` : undefined,
    error: error ? error.message : undefined
  };

  if (error) {
    logger.error('API Error', logData);
  } else {
    logger.info('API Request', logData);
  }
};

// Add a method for database query logging
logger.dbLog = (operation, collection, query, executionTime, error = null) => {
  const logData = {
    operation,
    collection,
    query: JSON.stringify(query),
    executionTime: `${executionTime}ms`,
    error: error ? error.message : undefined
  };

  if (error) {
    logger.error('DB Operation Failed', logData);
  } else {
    logger.debug('DB Operation', logData);
  }
};

module.exports = logger;