import { Request, Response, NextFunction } from 'express';
import rateLimit, { MemoryStore, Options } from 'express-rate-limit'

import config from '../providers/config';

const defaultRateLimit = (opts: Partial<Options>) => {
  return rateLimit({
    standardHeaders: false,
    legacyHeaders: false,
    store: new MemoryStore(),
    ...opts
  });
};


const RatelimiterDisabled = config.ratelimiter?.disabled || false;
const Buckets = {
  general: defaultRateLimit({
    max: 45,
    windowMs: 60 * 1000
  }),
  login: defaultRateLimit({
    max: 15,
    windowMs: 60 * 1000
  })
};

export const ratelimiterMiddleware = (bucketName: string) => {
  if (RatelimiterDisabled) {
    return (req: Request, res: Response, next: NextFunction) => {
      return next();
    }
  }

  if (!(bucketName in Buckets)) {
    return Buckets.general;
  }

  return Buckets[bucketName];
};
