import { Request, Response, NextFunction, CookieOptions } from 'express';
import moment from 'moment';

import { SessionContext, findSession, findSessionWithToken } from '../providers/session_provider';
import { BehindTLSProxy } from '../../providers/config';
import Account from '../../accounts/models/account';
import { findAccountById } from '../../accounts/providers/accounts_provider';

const SessionCookieName = 'SESSION_ID';
const SessionFieldName = 'sessionContext';
const SessionExtractionStatusFieldName = 'sessionContextExtraction';
const SessionAccountFieldName = 'sessionAccount';

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

      setSessionContext(sessionContext, req);
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

export const setSessionContext = (sessionContext: SessionContext | null, req: Request) => {
  req[SessionFieldName] = sessionContext;
  req[SessionAccountFieldName] = undefined;
};

export const getSessionAccount = (req: Request): Account | null => {
  if (req[SessionAccountFieldName]) {
    return req[SessionAccountFieldName] as Account;
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

export const includeSessionAccount = () => {
  const a = requireAuthentication();

  return async (req: Request, res: Response, next: NextFunction) => {
    await a(req, res, async () => {
      const sessionContext = getSessionContext(req);
      if (!sessionContext) {
        return next();
      }

      try {
        const account = await findAccountById(sessionContext.subject);
        req[SessionAccountFieldName] = account;
      } catch (err) {
        return next(err);
      }

      next();
    });
  };
};

export const sendSessionCookie = (req: Request, res: Response) => {
  const sessionContext = getSessionContext(req);
  let value = '';

  const options: CookieOptions = {
    httpOnly: true,
    sameSite: 'strict',
    secure: BehindTLSProxy
  };

  if (sessionContext) {
    if (sessionContext.expiresAt) {
      options.expires = sessionContext.expiresAt.toDate();
    }

    value = Buffer.from(`${sessionContext.subject}:${sessionContext.id}`).toString('base64');
  } else {
    options.expires = moment(0).toDate();
  }

  res.cookie(SessionCookieName, value, options);
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
