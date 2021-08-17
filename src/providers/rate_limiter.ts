import { Request, Response, NextFunction } from 'express';

import redisClient from './redis';
import { RatelimiterEnabled } from './config';

const RatelimiterRedisPrefix = 'ratelimit';
const RatelimiterMaxRequests = 250;
const RatelimiterTimeWindow = 60;

export const ratelimiterMiddleware = (bucketName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!RatelimiterEnabled) {
      return next();
    }

    const key = `${RatelimiterRedisPrefix}:${bucketName}:${req.ip}`;

    try {
      let requestsCount = await redisClient.get(key);
      if (!requestsCount) {
        requestsCount = 0;
      }

      if (requestsCount >= RatelimiterMaxRequests) {
        return res
          .status(429)
          .json({
            status: 'error',
            message: 'Too many requests'
          });
      }

      await redisClient.incr(key);

      if (requestsCount === 0) {
        await redisClient.expire(key, RatelimiterTimeWindow);
      }
    } catch (err) {
      return next(err);
    }

    next();
  };
};
