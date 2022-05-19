import { Router, Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';
import { validationMiddleware } from '../../common/middlewares/validation';

import {
  cookieAuthMiddleware,
  tokenAuthMiddleware,
  getSession,
  tryGetSession,
  requireAuthentication,
  setSession,
  sendSessionCookie
} from '../middlewares/authorization';
import Session from '../models/session';
import accountsProvider, {
  AccountDoesNotExistError,
  InvalidCredentialsError,
  InactiveAccountError
} from '../providers/accounts';
import sessionProvider from '../providers/session';

const PasswordAuthRequestValidators = [
  body('email')
    .exists().withMessage('required'),
  body('password')
    .exists().withMessage('required')
];

const sessionAPI = Router();

sessionAPI.get(
  '',
  cookieAuthMiddleware(),
  async (req: Request, res: Response) => {
    const session = tryGetSession(req);
    if (!session) {
      return res
        .status(401)
        .json({
          status: 'error',
          message: 'No session'
        });
    }

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
  }
);

sessionAPI.post(
  '',
  ratelimiterMiddleware('login'),
  ...PasswordAuthRequestValidators,
  validationMiddleware(),
  async (req: Request, res: Response, next: NextFunction) => {
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

sessionAPI.put(
  '',
  tokenAuthMiddleware(),
  requireAuthentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const oldSession = getSession(req);

    try {
      const session = await sessionProvider.refreshSession(oldSession);
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

sessionAPI.delete(
  '',
  tokenAuthMiddleware(),
  requireAuthentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const session = getSession(req);

    try {
      const isRevoked = await sessionProvider.revokeSession(session);

      if (!isRevoked) {
        return res
          .status(401)
          .json({
            status: 'error'
          });
      }

      setSession(req, null);
      sendSessionCookie(req, res);

      return res
        .status(200)
        .json({
          status: 'success'
        });
    } catch (err) {
      next(err);
    }
  }
);

export default sessionAPI;
