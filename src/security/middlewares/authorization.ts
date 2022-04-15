import { Request, Response, NextFunction, CookieOptions } from 'express';
import dayjs from 'dayjs';

import sessionProvider from '../providers/session';
import config from '../../common/providers/config';
import Session from '../models/session';

const SessionCookieName = 'SESSION_ID';
const SessionFieldName = 'session';
const SessionExtractionStatusFieldName = 'sessionExtraction';

const authMiddleware = (sessionExtractor: (req: Request) => (() => Promise<Session | null> | null)) => () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (getSession(req)) {
      return next();
    }

    try {
      const fn = sessionExtractor(req);
      if (!fn) {
        req[SessionExtractionStatusFieldName] = 'no_credentials';
        return next();
      }

      const session = await fn();
      if (!session) {
        req[SessionExtractionStatusFieldName] = 'invalid_credentials';
        return next();
      }

      setSession(req, session);
    } catch (err) {
      return next(err);
    }

    next();
  };
};

export const getSession = (req: Request): Session => {
  if (req[SessionFieldName]) {
    return req[SessionFieldName] as Session;
  }

  return null;
};

export const setSession = (req: Request, session: Session | null) => {
  req[SessionFieldName] = session;
};

export const cookieAuthMiddleware = authMiddleware((req: Request) => {
  const sessionId = req.cookies[SessionCookieName];
  if (!sessionId) {
    return null;
  }

  return (): Promise<Session | null> => {
    return sessionProvider.findById(sessionId);
  };
});

export const tokenAuthMiddleware = authMiddleware((req: Request) => {
  const authHeaderValue = req.headers['authorization'];
  if (!authHeaderValue) {
    return null;
  }

  const token = parseAuthHeader(Array.isArray(authHeaderValue) ? authHeaderValue[authHeaderValue.length - 1] : authHeaderValue);
  if (!token) {
    return null;
  }

  return (): Promise<Session | null> => {
    return sessionProvider.findByToken(token);
  };
});

export const requireAuthentication = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (getSession(req)) {
      return next();
    }

    const status = req[SessionExtractionStatusFieldName];

    if (!status || status === 'no_credentials') {
      return res
        .status(401)
        .json({
          status: 'error',
          message: 'Authentication required'
        });
    } else if (status === 'invalid_credentials') {
      return res
        .status(401)
        .json({
          status: 'error',
          message: 'Authentication failed'
        });
    } else {
      return res
        .status(401)
        .json({
          status: 'error'
        });
    }
  };
};

export const requireRoles = (roles: string[]) => {
  const a = requireAuthentication();

  return async (req: Request, res: Response, next: NextFunction) => {
    await a(req, res, async () => {
      const session = getSession(req);
      if (roles.some(r => session.roles.has(r))) {
        return next();
      }

      return res
        .status(403)
        .json({
          status: 'error',
          message: 'Access denied'
        });
    });
  };
};

export const sendSessionCookie = (req: Request, res: Response) => {
  const session = getSession(req);
  let value = '';

  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: config.server?.behindTLSProxy || false
  };

  if (session) {
    if (session.expiresAt) {
      options.expires = session.expiresAt.toDate();
    }

    value = session.id;
  } else {
    options.expires = dayjs(0).toDate();
  }

  res.cookie(SessionCookieName, value, options);
};

const parseAuthHeader = (authHeaderValue: string): string | null => {
  const parts = authHeaderValue.split(' ');

  if (parts.length !== 2) {
    return null;
  }

  if (parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
};
