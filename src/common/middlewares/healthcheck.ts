import { Request, Response, NextFunction } from 'express';
import moment from 'moment';
import config from '../providers/config';

const startupTime = moment();

const healthcheck = (req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next();
  }

  return res
    .status(200)
    .send({
      status: 'healthy',
      appVersion: config.version,
      startupTime: startupTime
    });
};

export default healthcheck;
