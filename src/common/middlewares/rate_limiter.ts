import { Request, Response, NextFunction } from 'express';
import onHeaders from 'on-headers';

import log from '../providers/logging';
import redisClient from '../providers/redis';
import config from '../providers/config';

export interface RatelimiterMiddlewareProps {
  countStatusCodes?: number[];
}

const RatelimiterRedisPrefix = 'ratelimit';
const RatelimiterDisabled = config.ratelimiter?.disabled || false;
const BucketsConfig = {
  general: {
    maxRequests: 45,
    timeWindow: 60
  },
  login: {
    maxRequests: 15,
    timeWindow: 60
  }
};

export const ratelimiterMiddleware = (bucketName: string, props?: RatelimiterMiddlewareProps) => {
  if (!props) {
    props = {};
  }

  const options = {
    countStatusCodes: props.countStatusCodes ? new Set(props.countStatusCodes) : undefined
  };

  let config = BucketsConfig.general;
  if (bucketName === 'login') {
    config = BucketsConfig.login;
  }

  return async (req: Request, res: Response, next: NextFunction) => {
    if (RatelimiterDisabled) {
      return next();
    }

    const key = `${RatelimiterRedisPrefix}:${bucketName}:${req.ip}`;

    try {
      let requestsCount = parseInt(await redisClient.GET(key));
      if (!requestsCount) {
        requestsCount = 0;
      }

      if (requestsCount >= config.maxRequests) {
        return res
          .status(429)
          .json({
            status: 'error',
            message: 'Too many requests'
          });
      }

      if (requestsCount === 0) {
        await redisClient.SETEX(key, config.timeWindow, '0');
      }
    } catch (err) {
      return next(err);
    }

    onHeaders(res, async () => {
      try {
        let count = true;
        if (options.countStatusCodes) {
          count = options.countStatusCodes.has(res.statusCode);
        }

        if (count) {
          await redisClient.incr(key);
        }
      } catch (err) {
        log.error(`error while updating ratelimiter state: ${err}`);
      }
    });

    next();
  };
};
