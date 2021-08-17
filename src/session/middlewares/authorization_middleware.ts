import { Request, Response, NextFunction } from 'express';
import { SessionContext, findSession, findSessionWithToken } from '../providers/session_provider';

const SessionCookieName = 'SESSION_ID';
const SessionFieldName = 'sessionContext';
const SessionExtractionStatusFieldName = 'sessionContextExtraction';

const authMiddleware = (sessionExtractor: (req: Request) => (() => Promise<SessionContext | null> | null)) => () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (getSessionContext(req)) {
      return next();
    }

    try {
      const fn = sessionExtractor(req);
      if (!fn) {
        req[SessionExtractionStatusFieldName] = 'no_credentials';
        return next();
      }

      const sessionContext = await fn();
      if (!sessionContext) {
        req[SessionExtractionStatusFieldName] = 'invalid_credentials';
        return next();
      }

      req[SessionFieldName] = sessionContext;
    } catch (err) {
      return next(err);
    }

    next();
  };
};

export const getSessionContext = (req: Request): SessionContext | null => {
  if (req[SessionFieldName]) {
    return req[SessionFieldName] as SessionContext;
  }

  return null;
};

export const cookieAuthMiddleware = authMiddleware((req: Request) => {
  const cookieValue = req.cookies[SessionCookieName];
  if (!cookieValue) {
    return null;
  }

  const parsed = parseSessionCookie(cookieValue);
  if (!parsed) {
    return null;
  }

  const [subject, sessionId] = parsed;

  return (): Promise<SessionContext | null> => {
    return findSession(subject, sessionId);
  };
});

export const tokenAuthMiddleware = authMiddleware((req: Request) => {
  const authHeaderValue = req.headers['authorization'];
  if (!authHeaderValue) {
    return null;
  }

  const token = parseAuthHeader(Array.isArray(authHeaderValue) ? authHeaderValue[authHeaderValue.length - 1] : authHeaderValue);

  return (): Promise<SessionContext | null> => {
    return findSessionWithToken(token);
  };
});

export const requireAuthentication = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (getSessionContext(req)) {
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
      const sessionContext = getSessionContext(req) as SessionContext;
      if (roles.some(r => sessionContext.roles.has(r))) {
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

const parseSessionCookie = (cookieValue: string): [subject: string, sessionId: string] | null => {
  try {
    const buf = Buffer.from(cookieValue, 'base64');
    const parts = buf.toString().split(':');

    if (parts.length !== 2) {
      return null;
    }

    return [parts[0], parts[1]];
  } catch (err) {
    if (err instanceof TypeError) {
      return null;
    }
  }
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
