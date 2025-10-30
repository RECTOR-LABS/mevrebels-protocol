import { Request, Response, NextFunction } from 'express';
import { redis } from '../services/redis';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);

export async function rateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const key = `rate-limit:${ip}`;

  try {
    const requests = await redis.incr(key);

    if (requests === 1) {
      await redis.expire(key, Math.floor(WINDOW_MS / 1000));
    }

    if (requests > MAX_REQUESTS) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Max ${MAX_REQUESTS} requests per ${WINDOW_MS / 1000}s.`,
      });
    }

    res.setHeader('X-RateLimit-Limit', MAX_REQUESTS.toString());
    res.setHeader('X-RateLimit-Remaining', (MAX_REQUESTS - requests).toString());

    next();
  } catch (error) {
    console.error('Rate limiter error:', error);
    next(); // Fail open
  }
}
