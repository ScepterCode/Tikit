/**
 * Centralized logging service with Sentry integration
 * Provides structured logging with context and error tracking
 */

// Sentry is optional - only import if available
let Sentry: any = null;
let ProfilingIntegration: any = null;

try {
  // Try to import Sentry (only available if installed)
  const sentryModule = await import('@sentry/node');
  const profilingModule = await import('@sentry/profiling-node');
  Sentry = sentryModule;
  ProfilingIntegration = profilingModule.ProfilingIntegration;
} catch (error) {
  // Sentry not installed - logging will work without it
  console.warn('Sentry not installed - error tracking disabled');
}

// Initialize Sentry if available
if (Sentry && process.env.SENTRY_DSN && process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.APP_VERSION || '1.0.0',
    
    // Performance monitoring
    tracesSampleRate: 0.1, // 10% of transactions
    
    // Profiling
    profilesSampleRate: 0.1, // 10% of transactions
    integrations: ProfilingIntegration ? [new ProfilingIntegration()] : [],
    
    // Error filtering
    beforeSend(event, hint) {
      // Don't send errors in development
      if (process.env.NODE_ENV !== 'production') {
        return null;
      }
      
      // Filter out known non-critical errors
      const error = hint.originalException;
      if (error instanceof Error) {
        // Don't send validation errors
        if (error.message.includes('Validation failed')) {
          return null;
        }
        
        // Don't send 404 errors
        if (error.message.includes('Not found')) {
          return null;
        }
      }
      
      return event;
    },
  });
}

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export interface LogContext {
  userId?: string;
  requestId?: string;
  eventId?: string;
  ticketId?: string;
  paymentId?: string;
  [key: string]: any;
}

/**
 * Structured log entry
 */
interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Format log entry for console output
 */
const formatLogEntry = (entry: LogEntry): string => {
  const { level, message, timestamp, context, error } = entry;
  
  let output = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
  
  if (context && Object.keys(context).length > 0) {
    output += ` | Context: ${JSON.stringify(context)}`;
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`;
    if (error.stack) {
      output += `\n  Stack: ${error.stack}`;
    }
  }
  
  return output;
};

/**
 * Log a message with context
 */
const log = (level: LogLevel, message: string, context?: LogContext): void => {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
  
  const formatted = formatLogEntry(entry);
  
  // Console output
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(formatted);
      break;
    case LogLevel.INFO:
      console.info(formatted);
      break;
    case LogLevel.WARN:
      console.warn(formatted);
      break;
    case LogLevel.ERROR:
    case LogLevel.FATAL:
      console.error(formatted);
      break;
  }
  
  // Send to Sentry for errors
  if (Sentry && (level === LogLevel.ERROR || level === LogLevel.FATAL)) {
    Sentry.captureMessage(message, {
      level: level === LogLevel.FATAL ? 'fatal' : 'error',
      contexts: {
        custom: context || {},
      },
    });
  }
};

/**
 * Log an error with full context
 */
const logError = (
  error: Error,
  message: string,
  context?: LogContext
): void => {
  const entry: LogEntry = {
    level: LogLevel.ERROR,
    message,
    timestamp: new Date().toISOString(),
    context,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  };
  
  const formatted = formatLogEntry(entry);
  console.error(formatted);
  
  // Send to Sentry with full error details
  if (Sentry) {
    Sentry.captureException(error, {
      contexts: {
        custom: context || {},
      },
      tags: {
        errorType: error.name,
      },
    });
  }
};

/**
 * Public logging API
 */
export const logger = {
  debug: (message: string, context?: LogContext) => {
    log(LogLevel.DEBUG, message, context);
  },
  
  info: (message: string, context?: LogContext) => {
    log(LogLevel.INFO, message, context);
  },
  
  warn: (message: string, context?: LogContext) => {
    log(LogLevel.WARN, message, context);
  },
  
  error: (message: string, error?: Error, context?: LogContext) => {
    if (error) {
      logError(error, message, context);
    } else {
      log(LogLevel.ERROR, message, context);
    }
  },
  
  fatal: (message: string, error?: Error, context?: LogContext) => {
    if (error) {
      const entry: LogEntry = {
        level: LogLevel.FATAL,
        message,
        timestamp: new Date().toISOString(),
        context,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      };
      
      const formatted = formatLogEntry(entry);
      console.error(formatted);
      
      if (Sentry) {
        Sentry.captureException(error, {
          level: 'fatal',
          contexts: {
            custom: context || {},
          },
        });
      }
    } else {
      log(LogLevel.FATAL, message, context);
    }
  },
};

/**
 * Express middleware for request logging
 */
export const requestLogger = (req: any, res: any, next: any) => {
  const startTime = Date.now();
  const requestId = req.headers['x-request-id'] || generateRequestId();
  
  // Attach request ID to request object
  req.requestId = requestId;
  
  // Log request
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? LogLevel.ERROR : 
                  res.statusCode >= 400 ? LogLevel.WARN : 
                  LogLevel.INFO;
    
    log(level, 'Request completed', {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });
  
  next();
};

/**
 * Express middleware for error logging
 */
export const errorLogger = (err: Error, req: any, res: any, next: any) => {
  logger.error('Request error', err, {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    userId: req.user?.id,
  });
  
  next(err);
};

/**
 * Set user context for Sentry
 */
export const setUserContext = (userId: string, email?: string, username?: string) => {
  if (Sentry) {
    Sentry.setUser({
      id: userId,
      email,
      username,
    });
  }
};

/**
 * Clear user context
 */
export const clearUserContext = () => {
  if (Sentry) {
    Sentry.setUser(null);
  }
};

/**
 * Add breadcrumb for debugging
 */
export const addBreadcrumb = (message: string, category: string, data?: any) => {
  if (Sentry) {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      level: 'info',
      timestamp: Date.now() / 1000,
    });
  }
};

/**
 * Start a transaction for performance monitoring
 */
export const startTransaction = (name: string, op: string) => {
  if (Sentry) {
    return Sentry.startTransaction({
      name,
      op,
    });
  }
  return null;
};

/**
 * Generate unique request ID
 */
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Flush Sentry events (useful for serverless)
 */
export const flushLogs = async (timeout: number = 2000): Promise<boolean> => {
  if (Sentry) {
    return await Sentry.flush(timeout);
  }
  return true;
};

export default logger;
