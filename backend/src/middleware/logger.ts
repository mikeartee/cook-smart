import {Request, Response, NextFunction} from 'express';
import HealthMonitor from '../services/HealthMonitor';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const {method, originalUrl, ip} = req;
    const {statusCode} = res;

    console.log(`${method} ${originalUrl} ${statusCode} ${duration}ms - ${ip}`);

    // Record successful requests in health monitor
    // Only count 2xx and 3xx as successful, 4xx and 5xx are handled in error middleware
    if (statusCode < 400) {
      try {
        HealthMonitor.recordRequest(false); // false = not an error
      } catch (monitorError) {
        console.error('Health monitor error (non-critical):', monitorError);
      }
    }
  });

  next();
};
