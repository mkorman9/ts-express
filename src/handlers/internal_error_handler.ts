import { Request, Response, NextFunction, Errback } from 'express';

import { log } from '../providers/logging';

const internalErrorHandler = (err: Errback, req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
        return next(err);
    }

    if (err) {
        log.error(`unexpected error while serving request: ${err}`);

        return res
            .status(500)
            .send({
                status: 'error',
                message: 'Unexpected internal error'
            });
    }
};

export default internalErrorHandler;
