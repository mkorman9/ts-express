import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';

import accountsProvider from '../providers/accounts';
import {
  setSession,
  sendSessionCookie
} from '../../security/middlewares/authorization';
import sessionProvider from '../../security/providers/session';
import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';

const PasswordAuthRequestValidators = [
  body('email')
    .exists().withMessage('required'),
  body('password')
    .exists().withMessage('required')
];

const authAPI = Router();

authAPI.post(
  '/password',
  ratelimiterMiddleware('login', { countStatusCodes: [401] }),
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
      const account = await accountsProvider.findAccountByCredentialsEmail(req.body['email']);

      if (!account || !account.passwordCredentials) {
        return res
          .status(401)
          .json({
            status: 'error',
            causes: [{
              field: 'credentials',
              code: 'invalid'
            }]
          });
      }

      const passwordMatch = await bcrypt.compare(req.body['password'], account.passwordCredentials.passwordBcrypt);
      if (!passwordMatch) {
        return res
          .status(401)
          .json({
            status: 'error',
            causes: [{
              field: 'credentials',
              code: 'invalid'
            }]
          });
      }

      if (!account.isActive) {
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

      const session = await sessionProvider.startSession(account, {
        ip: req.ip,
        duration: rememberMe ? dayjs.duration(14, 'days').asSeconds() : dayjs.duration(4, 'hours').asSeconds(),
        roles: account.roles
      });

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
