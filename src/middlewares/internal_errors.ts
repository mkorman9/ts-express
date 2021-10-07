import { Request, Response, NextFunction } from 'express';

import { log } from '../providers/logging';

const internalErrors = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err) {
    log.error(`unexpected error while serving request: ${err}`, { stack: err.stack });

    return res
      .status(500)
      .send({
        status: 'error',
        message: 'Unexpected internal error'
      });
  }
};

export default internalErrors;
