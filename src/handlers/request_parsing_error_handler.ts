import { Request, Response, NextFunction } from 'express';

const requestParsingErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err) {
    if (err instanceof SyntaxError) {
      return res
        .status(400)
        .send({
          status: 'error',
          message: 'Malformed request body'
        });
    } else {
      return res
        .status(400)
        .send({
          status: 'error',
          message: 'Unexpected error while parsing request'
        });
    }
  }
};

export default requestParsingErrorHandler;
