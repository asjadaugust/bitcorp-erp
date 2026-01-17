import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about the colors
winston.addColors(colors);

// Determine log level based on environment
const level = (): string => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'info';
};

// Define log format for development (pretty-printed)
const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, correlationId, ...metadata } = info;

    let msg = `${timestamp} [${level}]`;

    if (correlationId) {
      msg += ` [${correlationId}]`;
    }

    msg += `: ${message}`;

    // Add metadata if exists
    const metadataKeys = Object.keys(metadata);
    if (metadataKeys.length > 0) {
      // Remove some winston internal keys
      const cleanMetadata = Object.keys(metadata)
        .filter(
          (key) => !['Symbol(level)', 'Symbol(message)', 'Symbol(splat)'].includes(key.toString())
        )
        .reduce(
          (obj: Record<string, unknown>, key) => {
            obj[key] = metadata[key];
            return obj;
          },
          {} as Record<string, unknown>
        );

      if (Object.keys(cleanMetadata).length > 0) {
        msg += ` ${JSON.stringify(cleanMetadata, null, 2)}`;
      }
    }

    return msg;
  })
);

// Define log format for production (JSON)
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Determine which format to use
const format = process.env.NODE_ENV === 'production' ? prodFormat : devFormat;

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');

// Define transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: devFormat,
  }),
];

// Add file transports for production or if explicitly enabled
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGGING === 'true') {
  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      format: prodFormat,
      maxSize: '20m',
      maxFiles: '14d', // Keep 14 days of logs
      zippedArchive: true,
    })
  );

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      format: prodFormat,
      maxSize: '20m',
      maxFiles: '14d',
      zippedArchive: true,
    })
  );

  // Audit log file (separate for security events)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'audit-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'info',
      format: prodFormat,
      maxSize: '20m',
      maxFiles: '90d', // Keep audit logs for 90 days
      zippedArchive: true,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  exitOnError: false,
});

// Export the logger
export default logger;

// Export types for TypeScript
export type Logger = winston.Logger;
export type LogLevel = keyof typeof levels;
