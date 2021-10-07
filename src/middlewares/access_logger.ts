import { Request, Response, NextFunction } from 'express';
import onHeaders from 'on-headers';
import moment from 'moment';

import { log } from '../providers/logging';

const IgnoredPaths = new Set([
  '/health',
  '/metrics'
]);

const accessLogger = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const fullPath = req.baseUrl + req.path;
    if (IgnoredPaths.has(fullPath)) {
      return next();
    }

    const startTime = moment();

    onHeaders(res, () => {
      const elapsedTime = moment().diff(startTime, 'ms');

      log.info(`${req.method} ${req.originalUrl} - ${res.statusCode} (${elapsedTime} ms) [${req.ip}]`, {
        tag: 'access_log',
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        clientIp: req.ip
      });
    });

    next();
  };
};

export default accessLogger;
