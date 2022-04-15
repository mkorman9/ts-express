import { Request, Response, NextFunction } from 'express';
import dayjs from 'dayjs';
import config from '../providers/config';

const startupTime = dayjs();

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
