import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { logAggregationConfig } from './log-aggregation.config';

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

// Create logs directory
const logsDir = path.join(process.cwd(), logAggregationConfig.logsDir);

// Define transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: level(),
    format: devFormat,
  }),
];

// Add file transports for production or if explicitly enabled
if (logAggregationConfig.enabled) {
  const { categories } = logAggregationConfig;

  // Error log file (errors only)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.error.filename),
      datePattern: categories.error.datePattern,
      level: categories.error.level,
      format: prodFormat,
      maxSize: categories.error.maxSize,
      maxFiles: categories.error.maxFiles,
      zippedArchive: categories.error.zippedArchive,
    })
  );

  // Security log file (authentication, authorization)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.security.filename),
      datePattern: categories.security.datePattern,
      level: categories.security.level,
      format: prodFormat,
      maxSize: categories.security.maxSize,
      maxFiles: categories.security.maxFiles,
      zippedArchive: categories.security.zippedArchive,
    })
  );

  // Performance log file (slow queries, slow endpoints)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.performance.filename),
      datePattern: categories.performance.datePattern,
      level: categories.performance.level,
      format: prodFormat,
      maxSize: categories.performance.maxSize,
      maxFiles: categories.performance.maxFiles,
      zippedArchive: categories.performance.zippedArchive,
    })
  );

  // Audit log file (business operations, compliance)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.audit.filename),
      datePattern: categories.audit.datePattern,
      level: categories.audit.level,
      format: prodFormat,
      maxSize: categories.audit.maxSize,
      maxFiles: categories.audit.maxFiles,
      zippedArchive: categories.audit.zippedArchive,
    })
  );

  // HTTP access log file
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.http.filename),
      datePattern: categories.http.datePattern,
      level: categories.http.level,
      format: prodFormat,
      maxSize: categories.http.maxSize,
      maxFiles: categories.http.maxFiles,
      zippedArchive: categories.http.zippedArchive,
    })
  );

  // Combined log file (all levels)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, categories.combined.filename),
      datePattern: categories.combined.datePattern,
      level: categories.combined.level,
      format: prodFormat,
      maxSize: categories.combined.maxSize,
      maxFiles: categories.combined.maxFiles,
      zippedArchive: categories.combined.zippedArchive,
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
