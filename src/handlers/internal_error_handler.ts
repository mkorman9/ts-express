import { Request, Response, NextFunction, Errback } from 'express';

const internalErrorHandler = (err: Errback, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err) {
        return res
            .status(500)
            .send({
                status: 'error',
                message: 'Unexpected internal error'
            });
    }
};

export default internalErrorHandler;
