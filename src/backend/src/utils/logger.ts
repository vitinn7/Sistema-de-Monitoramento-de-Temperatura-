/**
 * Logger Utility
 * Sistema de Monitoramento de Temperatura
 * Subagente: Backend Developer (Node.js, Express, TypeScript)
 */

import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'grey',
  debug: 'white',
  silly: 'grey'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    
    // Add stack trace if present (for errors)
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Define console format for development
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, stack, ...meta } = info;
    
    let logMessage = `${timestamp} ${level}: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    // Add stack trace if present (for errors)
    if (stack) {
      logMessage += `\n${stack}`;
    }
    
    return logMessage;
  })
);

// Define which transports the logger must have
const transports: winston.transport[] = [];

// Console transport for all environments
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? format : consoleFormat,
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  })
);

// File transports for non-development environments
if (process.env.NODE_ENV !== 'test') {
  const logDir = process.env.LOG_DIR || path.join(__dirname, '../../logs');
  
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  );
  
  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
      tailable: true
    })
  );
  
  // HTTP requests log file
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'http.log'),
      level: 'http',
      format,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
      tailable: true
    })
  );
}

// Create the logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
  levels,
  format,
  transports,
  exitOnError: false,
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

// Create a stream object with a 'write' function that will be used by morgan
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  }
};

// Helper functions for common logging patterns
export const logError = (error: Error, context?: object) => {
  logger.error(error.message, {
    stack: error.stack,
    name: error.name,
    ...context
  });
};

export const logApiRequest = (method: string, url: string, statusCode: number, responseTime: number, userId?: string) => {
  logger.http('API Request', {
    method,
    url,
    statusCode,
    responseTime: `${responseTime}ms`,
    userId
  });
};

export const logDatabaseOperation = (operation: string, table: string, duration: number, rowsAffected?: number) => {
  logger.debug('Database Operation', {
    operation,
    table,
    duration: `${duration}ms`,
    rowsAffected
  });
};

export const logExternalApiCall = (service: string, endpoint: string, statusCode: number, responseTime: number) => {
  logger.info('External API Call', {
    service,
    endpoint,
    statusCode,
    responseTime: `${responseTime}ms`
  });
};

export const logAlert = (alertType: string, city: string, temperature: number, threshold: number) => {
  logger.warn('Temperature Alert', {
    alertType,
    city,
    temperature,
    threshold
  });
};

// Export default logger
export default logger;
