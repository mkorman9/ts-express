import { Request, Response, NextFunction } from 'express';

const healthcheck = (req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next();
  }

  return res
    .status(200)
    .send({
      status: 'healthy'
    });
};

export default healthcheck;
