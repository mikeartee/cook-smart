import {Request, Response, NextFunction} from 'express';
import NotificationService from '../services/NotificationService';
import ThrottleManager from '../services/ThrottleManager';
import AutoRepairSystem from '../services/AutoRepairSystem';
import HealthMonitor from '../services/HealthMonitor';
import ErrorLogModel from '../models/ErrorLog';

type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low';

/**
 * Classify error severity based on error type and HTTP status
 */
function classifyErrorSeverity(error: any, statusCode: number): ErrorSeverity {
  const message = error.message?.toLowerCase() || '';

  // Critical errors
  if (
    (message.includes('database') && message.includes('connection')) ||
    message.includes('econnrefused') ||
    message.includes('authentication system') ||
    statusCode === 503
  ) {
    return 'critical';
  }

  // High severity errors
  if (
    statusCode === 500 ||
    message.includes('unhandled') ||
    message.includes('fatal') ||
    message.includes('crash')
  ) {
    return 'high';
  }

  // Medium severity errors
  if (
    statusCode === 400 ||
    statusCode === 422 ||
    message.includes('validation') ||
    message.includes('rate limit')
  ) {
    return 'medium';
  }

  // Low severity errors (404, expected errors)
  return 'low';
}

/**
 * Extract context from request for error notification
 */
function extractContext(
  req: Request,
  _error: any,
): {
  userId?: string;
  endpoint?: string;
  affectedUsers?: number;
  requestBody?: any;
} {
  return {
    userId: (req as any).user?.id || undefined,
    endpoint: `${req.method} ${req.path}`,
    affectedUsers: 1, // Could be enhanced to track multiple users
    requestBody: req.method !== 'GET' ? req.body : undefined,
  };
}

/**
 * Determine HTTP status code from error
 */
function getStatusCode(error: any): number {
  if (error.statusCode) {
    return error.statusCode;
  }
  if (error.status) {
    return error.status;
  }
  if (error.message?.includes('not found')) {
    return 404;
  }
  if (
    error.message?.includes('unauthorized') ||
    error.message?.includes('authentication')
  ) {
    return 401;
  }
  if (error.message?.includes('forbidden')) {
    return 403;
  }
  if (error.message?.includes('validation')) {
    return 400;
  }
  return 500;
}

/**
 * Format error response for client
 */
function formatErrorResponse(
  error: any,
  statusCode: number,
): {
  error: string;
  message: string;
  statusCode: number;
} {
  // Never expose internal error details in production
  const isProduction = process.env.NODE_ENV === 'production';

  let message = 'An error occurred';

  if (!isProduction || statusCode < 500) {
    // Show actual message for client errors (4xx) or in development
    message = error.message || message;
  }

  return {
    error: getErrorType(statusCode),
    message,
    statusCode,
  };
}

/**
 * Get error type from status code
 */
function getErrorType(statusCode: number): string {
  if (statusCode === 400) return 'Bad Request';
  if (statusCode === 401) return 'Unauthorized';
  if (statusCode === 403) return 'Forbidden';
  if (statusCode === 404) return 'Not Found';
  if (statusCode === 422) return 'Validation Error';
  if (statusCode === 429) return 'Too Many Requests';
  if (statusCode === 500) return 'Internal Server Error';
  if (statusCode === 503) return 'Service Unavailable';
  return 'Error';
}

/**
 * Error handling middleware
 * Catches all errors from route handlers and sends notifications
 */
export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Log error to console
  console.error('❌ Error caught by middleware:', err);

  // Record error in health monitor (wrapped to prevent cascading errors)
  try {
    HealthMonitor.recordRequest(true);
  } catch (monitorError) {
    console.error('Health monitor error (non-critical):', monitorError);
  }

  // Determine status code and severity
  const statusCode = getStatusCode(err);
  const severity = classifyErrorSeverity(err, statusCode);
  const context = extractContext(req, err);

  // Save error to database (async, don't block response)
  (async () => {
    try {
      await ErrorLogModel.log({
        severity,
        errorType: err.name || 'Error',
        message: err.message || 'Unknown error',
        stack: err.stack,
        endpoint: `${req.method} ${req.path}`,
        method: req.method,
        statusCode,
        userId: (req as any).user?.id,
        requestBody: req.method !== 'GET' ? req.body : undefined,
      });
    } catch (logError) {
      console.error('Failed to log error to database:', logError);
    }
  })();

  // Generate throttle key
  const throttleKey = ThrottleManager.generateErrorKey(err, context.endpoint);

  // Check if we should send notification (throttling)
  const shouldNotify = ThrottleManager.shouldSendNotification(
    throttleKey,
    'error',
    severity,
  );

  if (shouldNotify) {
    // Send error notification asynchronously (don't block response)
    (async () => {
      try {
        // Attempt auto-repair
        const repairResult = await AutoRepairSystem.attemptRepair(err);

        // Send notification with repair status
        await NotificationService.sendErrorNotification(err, severity, {
          ...context,
          ...(repairResult &&
            ({
              repairAttempted: true,
              repairSuccess: repairResult.success,
              repairMessage: repairResult.message,
              repairAction: repairResult.action,
            } as any)),
        });

        // Record that notification was sent
        ThrottleManager.recordNotification(throttleKey, 'error', true);
      } catch (notificationError) {
        console.error('Failed to send error notification:', notificationError);
      }
    })();
  } else {
    // Record that notification was throttled
    ThrottleManager.recordNotification(throttleKey, 'error', false);
    console.log(
      `⏸️  Error notification throttled (${ThrottleManager.getThrottledCount(throttleKey)} throttled)`,
    );
  }

  // Send error response to client
  const errorResponse = formatErrorResponse(err, statusCode);
  res.status(statusCode).json(errorResponse);
}

/**
 * 404 Not Found handler
 * Should be added before the error middleware
 * Filters out common bot/scanner traffic to reduce noise
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Common bot/scanner paths to ignore (don't log as errors)
  const botPaths = [
    '/GponForm',
    '/diag_Form',
    '/favicon.ico',
    '/.env',
    '/wp-admin',
    '/wp-login',
    '/wp-content',
    '/admin',
    '/phpmyadmin',
    '/xmlrpc.php',
    '/.git',
  ];

  // Check for PHP exploit attempts (all .php files are bot attacks - we don't use PHP)
  const isPhpExploit = req.path.endsWith('.php');

  const isBotTraffic =
    isPhpExploit || botPaths.some(path => req.path.includes(path));

  if (isBotTraffic) {
    // Silently return 404 for bot traffic without logging
    res.status(404).json({error: 'Not Found'});
    return;
  }

  const error = new Error(`Route not found: ${req.method} ${req.path}`);
  (error as any).statusCode = 404;
  next(error);
}
