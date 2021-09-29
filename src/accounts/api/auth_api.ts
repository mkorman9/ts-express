import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import moment from 'moment';
import bcrypt from 'bcrypt';

import { findAccountByCredentialsEmail } from '../providers/accounts_provider';
import {
  setSessionContext,
  sendSessionCookie
} from '../../session/middlewares/authorization_middleware';
import {
  startSession
} from '../../session/providers/session_provider';
import { ratelimiterMiddleware } from '../../providers/rate_limiter';

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
      const account = await findAccountByCredentialsEmail(req.body['email']);

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

      const sessionContext = await startSession(account.id, {
        ip: req.ip,
        duration: rememberMe ? moment.duration(14, 'days').asSeconds() : moment.duration(4, 'hours').asSeconds(),
        roles: account.roles
      });

      setSessionContext(sessionContext, req);
      sendSessionCookie(req, res);

      return res
        .status(200)
        .json({
          id: sessionContext.id,
          startTime: sessionContext.issuedAt,
          expiresAt: sessionContext.expiresAt,
          subject: sessionContext.subject,
          loginIp: sessionContext.ip,
          roles: Array.from(sessionContext.roles),
          accessToken: sessionContext.raw
        });
    } catch (err) {
      next(err);
    }
  }
);

export default authAPI;
