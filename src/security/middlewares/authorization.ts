import { Request, Response, NextFunction, CookieOptions } from 'express';
import dayjs from 'dayjs';

import sessionProvider from '../providers/session';
import config from '../../common/providers/config';
import Session from '../models/session';

const SessionCookieName = 'SESSION_ID';
const SessionFieldName = 'session';
const SessionExtractionStatusFieldName = 'sessionExtraction';

type SessionAcquireFunc = () => Promise<Session | null>;
type SessionExtractionResult = 'extraction_failed' |
  SessionAcquireFunc;

const authMiddleware = (sessionExtractor: (req: Request) => SessionExtractionResult) => () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (tryGetSession(req)) {
      return next();
    }

    try {
      const result = sessionExtractor(req);
      if (result === 'extraction_failed') {
        req[SessionExtractionStatusFieldName] = 'no_credentials';
        return next();
      }

      const session = await result();
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

export const tryGetSession = (req: Request): (Session | null) => {
  if (req[SessionFieldName]) {
    return req[SessionFieldName] as Session;
  }

  return null;
};

export const getSession = (req: Request): Session => {
  const session = tryGetSession(req);
  if (!session) {
    throw new Error("could not acquire active session");
  }

  return session;
}

export const setSession = (req: Request, session: Session | null) => {
  req[SessionFieldName] = session;
};

export const cookieAuthMiddleware = authMiddleware((req: Request): SessionExtractionResult => {
  const sessionId = req.cookies[SessionCookieName];
  if (!sessionId) {
    return 'extraction_failed';
  }

  return (): Promise<Session | null> => {
    return sessionProvider.findById(sessionId);
  };
});

export const tokenAuthMiddleware = authMiddleware((req: Request): SessionExtractionResult => {
  const authHeaderValue = req.headers['authorization'];
  if (!authHeaderValue) {
    return 'extraction_failed';
  }

  const token = parseAuthHeader(Array.isArray(authHeaderValue) ? authHeaderValue[authHeaderValue.length - 1] : authHeaderValue);
  if (!token) {
    return 'extraction_failed';
  }

  return (): Promise<Session | null> => {
    return sessionProvider.findByToken(token);
  };
});

export const requireAuthentication = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (tryGetSession(req)) {
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
  const session = tryGetSession(req);
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
