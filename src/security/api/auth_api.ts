import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';

import accountsProvider, {
  AccountDoesNotExistError,
  InvalidPasswordError as InvalidCredentialsError,
  InactiveAccountError
} from '../providers/accounts';
import {
  setSession,
  sendSessionCookie
} from '../../security/middlewares/authorization';
import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';
import Session from '../models/session';

const PasswordAuthRequestValidators = [
  body('email')
    .exists().withMessage('required'),
  body('password')
    .exists().withMessage('required')
];

const authAPI = Router();

authAPI.post(
  '/password',
  ratelimiterMiddleware('login'),
  ...PasswordAuthRequestValidators,
  async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    const rememberMe = 'rememberMe' in req.query;

    try {
      let session: Session | null;
      try {
        session = await accountsProvider.authorizeByPassword(req.body.email, req.body.password, {
          prolongedSession: rememberMe,
          ip: req.ip
        });
      } catch (err) {
        if (err instanceof AccountDoesNotExistError || err instanceof InvalidCredentialsError) {
          return res
            .status(401)
            .json({
              status: 'error',
              causes: [{
                field: 'credentials',
                code: 'invalid'
              }]
            });
        } else if (err instanceof InactiveAccountError) {
          return res
            .status(401)
            .json({
              status: 'error',
              causes: [{
                field: 'account',
                code: 'inactive'
              }]
            });
        }

        throw err;
      }

      setSession(req, session);
      sendSessionCookie(req, res);

      return res
        .status(200)
        .json({
          id: session.id,
          startTime: session.issuedAt,
          expiresAt: session.expiresAt,
          subject: session.account.id,
          loginIp: session.ip,
          roles: Array.from(session.roles),
          accessToken: session.token
        });
    } catch (err) {
      next(err);
    }
  }
);

export default authAPI;
