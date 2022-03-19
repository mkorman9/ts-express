import { Router, Request, Response, NextFunction } from 'express';

import {
  cookieAuthMiddleware,
  tokenAuthMiddleware,
  getSessionContext,
  requireAuthentication,
  setSessionContext,
  sendSessionCookie
} from '../middlewares/authorization';
import {
  refreshSession,
  revokeSession
} from '../providers/session';

const sessionAPI = Router();

sessionAPI.get(
  '/token',
  cookieAuthMiddleware(),
  async (req: Request, res: Response) => {
    const sessionContext = getSessionContext(req);
    if (!sessionContext) {
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
        id: sessionContext.id,
        startTime: sessionContext.issuedAt,
        expiresAt: sessionContext.expiresAt,
        subject: sessionContext.subject,
        loginIp: sessionContext.ip,
        roles: Array.from(sessionContext.roles),
        accessToken: sessionContext.raw
      });
  }
);

sessionAPI.put(
  '/refresh',
  tokenAuthMiddleware(),
  requireAuthentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const oldSessionContext = getSessionContext(req);

    try {
      const sessionContext = await refreshSession(oldSessionContext);
      setSessionContext(req, sessionContext);

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

sessionAPI.post(
  '/revoke',
  tokenAuthMiddleware(),
  requireAuthentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionContext = getSessionContext(req);

    try {
      const isRevoked = await revokeSession(sessionContext);

      if (!isRevoked) {
        return res
          .status(401)
          .json({
            status: 'error'
          });
      }

      setSessionContext(req, null);
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
