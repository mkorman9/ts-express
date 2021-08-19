import { Request, Response, NextFunction } from 'express';
import onHeaders from 'on-headers';
import moment from 'moment';

import { log } from './logging';

const IgnoredPaths = new Set([
  '/health'
]);

export const accessLogger = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const fullPath = req.baseUrl + req.path;
    if (IgnoredPaths.has(fullPath)) {
      return next();
    }

    const startTime = moment();

    onHeaders(res, () => {
      const elapsedTime = moment().diff(startTime, 'ms');

      log.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${elapsedTime} ms) [${req.ip}]`);
    });

    next();
  };
};
