import { Router, Request, Response, NextFunction } from 'express';

import {
  cookieAuthMiddleware,
  tokenAuthMiddleware,
  getSession,
  requireAuthentication,
  setSession,
  sendSessionCookie
} from '../middlewares/authorization';
import sessionProvider from '../providers/session';

const sessionAPI = Router();

sessionAPI.get(
  '/token',
  cookieAuthMiddleware(),
  async (req: Request, res: Response) => {
    const session = getSession(req);
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

sessionAPI.put(
  '/refresh',
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

sessionAPI.post(
  '/revoke',
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
