import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private requests: Record<string, { count: number; timestamp: number }> = {};
  private readonly limit = 2;
  private readonly windowMs = 60 * 1000; // 1 minute

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip;
    const now = Date.now();

    const record = this.requests[ip] || { count: 0, timestamp: now };

    if (now - record.timestamp > this.windowMs) {
      record.count = 1;
      record.timestamp = now;
    } else {
      record.count += 1;
    }

    this.requests[ip] = record;

    if (record.count > this.limit) {
      console.warn(`Rate limit exceeded for IP: ${ip}`);
      return res.status(429).json({
        status: 'FAILURE',
        message: 'Rate limit exceeded. Try again later.',
      });
    }

    next();
  }
}
