import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { logAggregationConfig } from '../config/log-aggregation.config';

/**
 * Log entry interface (parsed JSON log)
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  correlationId?: string;
  userId?: number;
  username?: string;
  context?: string;
  category?: string;
  [key: string]: unknown;
}

/**
 * Query options for filtering logs
 */
export interface LogQueryOptions {
  /** Filter by log level(s) */
  level?: string | string[];
  /** Filter by correlation ID */
  correlationId?: string;
  /** Filter by user ID */
  userId?: number;
  /** Filter by username */
  username?: string;
  /** Filter by context */
  context?: string;
  /** Filter by category (security, performance, audit) */
  category?: string;
  /** Filter by date (YYYY-MM-DD) */
  date?: string;
  /** Filter by date range */
  dateFrom?: string;
  dateTo?: string;
  /** Search in message text */
  search?: string;
  /** Maximum number of results */
  limit?: number;
  /** Skip first N results */
  offset?: number;
}

/**
 * Log Query Utility
 *
 * Provides methods to search, filter, and analyze log files.
 * Supports querying by correlation ID, user, date, level, and more.
 *
 * Usage:
 *   const query = new LogQuery('combined');
 *   const results = await query.find({ correlationId: 'abc-123' });
 *   const errors = await query.findErrors({ date: '2026-01-17' });
 */
export class LogQuery {
  private logType: string;
  private logsDir: string;

  /**
   * Create a log query instance
   * @param logType - Type of log to query (error, security, performance, audit, http, combined)
   */
  constructor(logType: 'error' | 'security' | 'performance' | 'audit' | 'http' | 'combined') {
    this.logType = logType;
    this.logsDir = path.join(process.cwd(), logAggregationConfig.logsDir);
  }

  /**
   * Find log entries matching the given criteria
   */
  async find(options: LogQueryOptions = {}): Promise<LogEntry[]> {
    const files = await this.getLogFiles(options.date, options.dateFrom, options.dateTo);
    const results: LogEntry[] = [];

    for (const file of files) {
      const entries = await this.readLogFile(file, options);
      results.push(...entries);

      // Stop if we've reached the limit
      if (options.limit && results.length >= options.limit) {
        break;
      }
    }

    // Apply offset and limit
    const offset = options.offset || 0;
    const limit = options.limit || results.length;

    return results.slice(offset, offset + limit);
  }

  /**
   * Find errors in logs
   */
  async findErrors(options: Omit<LogQueryOptions, 'level'> = {}): Promise<LogEntry[]> {
    return this.find({ ...options, level: 'error' });
  }

  /**
   * Find logs by correlation ID
   */
  async findByCorrelationId(
    correlationId: string,
    options: LogQueryOptions = {}
  ): Promise<LogEntry[]> {
    return this.find({ ...options, correlationId });
  }

  /**
   * Find logs by user
   */
  async findByUser(
    userId: number,
    options: Omit<LogQueryOptions, 'userId'> = {}
  ): Promise<LogEntry[]> {
    return this.find({ ...options, userId });
  }

  /**
   * Find logs by date
   */
  async findByDate(date: string, options: Omit<LogQueryOptions, 'date'> = {}): Promise<LogEntry[]> {
    return this.find({ ...options, date });
  }

  /**
   * Search logs by text
   */
  async search(
    searchText: string,
    options: Omit<LogQueryOptions, 'search'> = {}
  ): Promise<LogEntry[]> {
    return this.find({ ...options, search: searchText });
  }

  /**
   * Get log files matching the date criteria
   */
  private async getLogFiles(date?: string, dateFrom?: string, dateTo?: string): Promise<string[]> {
    const pattern = this.getFilePattern();

    try {
      const files = fs.readdirSync(this.logsDir);
      let matchingFiles = files.filter((file) => file.startsWith(pattern.replace('-%DATE%', '')));

      // Filter by date if specified
      if (date) {
        matchingFiles = matchingFiles.filter((file) => file.includes(date));
      } else if (dateFrom || dateTo) {
        matchingFiles = matchingFiles.filter((file) => {
          const match = file.match(/(\d{4}-\d{2}-\d{2})/);
          if (!match) return false;

          const fileDate = match[1];
          if (dateFrom && fileDate < dateFrom) return false;
          if (dateTo && fileDate > dateTo) return false;
          return true;
        });
      }

      // Sort by date (newest first)
      matchingFiles.sort().reverse();

      return matchingFiles.map((file) => path.join(this.logsDir, file));
    } catch {
      // Directory doesn't exist or can't be read
      return [];
    }
  }

  /**
   * Read and filter a single log file
   */
  private async readLogFile(filePath: string, options: LogQueryOptions): Promise<LogEntry[]> {
    const results: LogEntry[] = [];

    if (!fs.existsSync(filePath)) {
      return results;
    }

    const fileStream = fs.createReadStream(filePath);
    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity,
    });

    for await (const line of rl) {
      if (!line.trim()) continue;

      try {
        const entry = JSON.parse(line) as LogEntry;

        // Apply filters
        if (!this.matchesFilters(entry, options)) {
          continue;
        }

        results.push(entry);

        // Stop if we have enough results
        if (options.limit && results.length >= options.limit + (options.offset || 0)) {
          break;
        }
      } catch {
        // Skip malformed JSON lines
        continue;
      }
    }

    return results;
  }

  /**
   * Check if a log entry matches the given filters
   */
  private matchesFilters(entry: LogEntry, options: LogQueryOptions): boolean {
    // Level filter
    if (options.level) {
      const levels = Array.isArray(options.level) ? options.level : [options.level];
      if (!levels.includes(entry.level)) {
        return false;
      }
    }

    // Correlation ID filter
    if (options.correlationId && entry.correlationId !== options.correlationId) {
      return false;
    }

    // User ID filter
    if (options.userId !== undefined && entry.userId !== options.userId) {
      return false;
    }

    // Username filter
    if (options.username && entry.username !== options.username) {
      return false;
    }

    // Context filter
    if (options.context && entry.context !== options.context) {
      return false;
    }

    // Category filter
    if (options.category && entry.category !== options.category) {
      return false;
    }

    // Text search
    if (options.search) {
      const searchLower = options.search.toLowerCase();
      const messageMatch = entry.message.toLowerCase().includes(searchLower);
      const contextMatch = entry.context?.toLowerCase().includes(searchLower);
      const categoryMatch = entry.category?.toLowerCase().includes(searchLower);

      if (!messageMatch && !contextMatch && !categoryMatch) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get the file pattern for this log type
   */
  private getFilePattern(): string {
    const category =
      logAggregationConfig.categories[this.logType as keyof typeof logAggregationConfig.categories];
    return category.filename;
  }

  /**
   * Count log entries matching the criteria
   */
  async count(options: LogQueryOptions = {}): Promise<number> {
    const results = await this.find({ ...options, limit: undefined, offset: undefined });
    return results.length;
  }

  /**
   * Get unique values for a field
   */
  async distinct(field: keyof LogEntry, options: LogQueryOptions = {}): Promise<unknown[]> {
    const results = await this.find(options);
    const values = new Set(results.map((entry) => entry[field]).filter((v) => v !== undefined));
    return Array.from(values);
  }
}

/**
 * Convenience function to query combined logs
 */
export const queryCombinedLogs = (options: LogQueryOptions = {}): Promise<LogEntry[]> => {
  const query = new LogQuery('combined');
  return query.find(options);
};

/**
 * Convenience function to query error logs
 */
export const queryErrorLogs = (options: LogQueryOptions = {}): Promise<LogEntry[]> => {
  const query = new LogQuery('error');
  return query.find(options);
};

/**
 * Convenience function to query security logs
 */
export const querySecurityLogs = (options: LogQueryOptions = {}): Promise<LogEntry[]> => {
  const query = new LogQuery('security');
  return query.find(options);
};

/**
 * Convenience function to query performance logs
 */
export const queryPerformanceLogs = (options: LogQueryOptions = {}): Promise<LogEntry[]> => {
  const query = new LogQuery('performance');
  return query.find(options);
};

/**
 * Convenience function to query audit logs
 */
export const queryAuditLogs = (options: LogQueryOptions = {}): Promise<LogEntry[]> => {
  const query = new LogQuery('audit');
  return query.find(options);
};
