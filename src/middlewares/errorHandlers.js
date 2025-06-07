require('dotenv').config()
const winston = require('winston');


const { createLogger, format, transports } = winston;


// Define log levels with corresponding priorities
const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

// Create a production-ready logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'error',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.simple()
      ),
    })
  ],
  // No exits on uncaught exceptions
  exitOnError: false
});

// Sanitize error response for production
const sanitizeError = (err, includeStack = false) => {
  const sanitized = {
    status: err.status || 500,
    message: err.message || 'An unexpected error occurred'
  };
  
  // Only include stack trace if explicitly requested and not in production
  if (includeStack && process.env.NODE_ENV !== 'production') {
    sanitized.stack = err.stack;
  }
  
  return sanitized;
};

// Global error handling middleware
const globalErrorHandler = (err, req, res, next) => {
  // Determine the appropriate status code
  const statusCode = err.status || 500;
  
  // Sanitize the error message for production
  const sanitizedError = sanitizeError(err);
  
  logger.error('Request Error', {
    method: req.method,
    url: req.originalUrl,
    // No sensitive data in production
    body: process.env.NODE_ENV === 'production' ? '[REDACTED]' : req.body,
    query: process.env.NODE_ENV === 'production' ? '[REDACTED]' : req.query,
    params: req.params,
    statusCode,
    errorMessage: sanitizedError.message,
    stack: err.stack,
    // Include request metadata
    requestId: req.id,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  return res.status(statusCode).json({
    error: sanitizedError
  });
  
};

// 404 handler for undefined routes
const notFoundHandler = (req, res) => {
  const errorPage = ERROR_PAGES[404];
  res.status(404).type('html').send(errorPage);
};

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error,
    stack: error.stack
  });
  // Give the process time to log before exiting
  setTimeout(() => {
    process.exit(1);
  }, 1000);
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    stack: reason?.stack
  });
});

module.exports = {
  globalErrorHandler,
  notFoundHandler
};