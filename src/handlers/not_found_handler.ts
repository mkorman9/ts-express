import { Request, Response, NextFunction } from 'express';

const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next();
  }

  return res
    .status(404)
    .send({
      status: 'error',
      message: 'Not found'
    });
};

export default notFoundHandler;
