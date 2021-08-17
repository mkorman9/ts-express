import { Router, Request, Response, NextFunction } from 'express';

import {
  cookieAuthMiddleware,
  tokenAuthMiddleware,
  getSessionContext,
  requireAuthentication,
  setSessionContext,
  sendSessionCookie
} from '../../session/middlewares/authorization_middleware';
import {
  SessionContext,
  refreshSession,
  revokeSession
} from '../providers/session_provider';

const sessionAPI = Router();

sessionAPI.get(
  '/status',
  cookieAuthMiddleware(),
  async (req: Request, res: Response, next: NextFunction) => {
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
    const oldSessionContext = getSessionContext(req) as SessionContext;

    try {
      const sessionContext = await refreshSession(oldSessionContext);
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

sessionAPI.post(
  '/revoke',
  tokenAuthMiddleware(),
  requireAuthentication(),
  async (req: Request, res: Response, next: NextFunction) => {
    const sessionContext = getSessionContext(req) as SessionContext;

    try {
      const isRevoked = await revokeSession(sessionContext);

      if (!isRevoked) {
        return res
          .status(401)
          .json({
            status: 'error'
          });
      }

      setSessionContext(null, req);
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
