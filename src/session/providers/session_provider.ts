import moment, { Moment } from 'moment';
import { randomBytes } from 'crypto';

import redisClient from '../../providers/redis';

export interface SessionContext {
  id: string;
  issuedAt: Moment;
  expiresAt: Moment | null;
  duration: number;
  issuer: string;
  subject: string;
  ip: string;
  roles: Set<string>;
  resources: Set<string> | null;
  raw: string;
}

export interface NewSessionProps {
  issuer?: string;
  ip?: string;
  duration?: number;
  roles?: string[];
  resources?: string[];
}

const SessionRedisKeyPrefix = 'session';
const TokenRedisKeyPrefix = 'token';
const SessionIdLength = 48;
const SessionTokenLength = 48;

export const findSession = async (subject: string, sessionId: string): Promise<SessionContext | null> => {
  const sessionData = await redisClient.hgetall(`${SessionRedisKeyPrefix}:${subject}:${sessionId}`);
  if (Object.keys(sessionData).length === 0) {
    return null;
  }

  return buildSessionContext(sessionData);
};

export const findSessionWithToken = async (token: string): Promise<SessionContext | null> => {
  const sessionKey = await redisClient.get(`${TokenRedisKeyPrefix}:${token}`);
  if (!sessionKey) {
    return null;
  }

  const sessionData = await redisClient.hgetall(`${SessionRedisKeyPrefix}:${sessionKey.toString()}`);
  if (Object.keys(sessionData).length === 0) {
    return null;
  }

  return buildSessionContext(sessionData);
};

export const startSession = async (subject: string, props: NewSessionProps = {}): Promise<SessionContext> => {
  const now = moment();
  const sessionContext: SessionContext = {
    id: generateSecureRandomString(SessionIdLength),
    issuedAt: now,
    expiresAt: (props.duration && props.duration > 0) ? moment(now).add(props.duration, 'seconds') : null,
    duration: props.duration || 0,
    issuer: props.issuer || '',
    subject: subject,
    ip: props.ip || '',
    roles: new Set(props.roles || []),
    resources: props.resources ? new Set(props.resources) : null,
    raw: generateSecureRandomString(SessionTokenLength)
  };
  const sessionData = serializeSessionContext(sessionContext);
  const sessionKey = `${SessionRedisKeyPrefix}:${subject}:${sessionContext.id}`;
  const tokenKey = `${TokenRedisKeyPrefix}:${sessionContext.raw}`;

  await redisClient.hmset(sessionKey, sessionData);
  await redisClient.set(tokenKey, `${subject}:${sessionContext.id}`);

  if (props.duration && props.duration > 0) {
    await redisClient.expire(sessionKey, props.duration);
    await redisClient.expire(tokenKey, props.duration);
  }

  return sessionContext;
};

const buildSessionContext = (sessionData: {[prop: string]: string}): SessionContext => {
  return {
    id: sessionData['id'],
    issuedAt: moment(parseInt(sessionData['issuedAt'])),
    expiresAt: sessionData['expiresAt'] ? moment(parseInt(sessionData['expiresAt'])) : null,
    duration: parseInt(sessionData['duration']),
    issuer: sessionData['issuer'],
    subject: sessionData['subject'],
    ip: sessionData['ip'],
    roles: new Set(sessionData['roles'].split(';')),
    resources: sessionData['resources'] ? new Set(sessionData['resources'].split(';')) : null,
    raw: sessionData['raw']
  };
};

const serializeSessionContext = (sessionContext: SessionContext): {[prop: string]: string} => {
  let d = {
    id: sessionContext.id,
    issuedAt: sessionContext.issuedAt.valueOf().toString(),
    duration: sessionContext.duration.toString(),
    issuer: sessionContext.issuer,
    subject: sessionContext.subject,
    ip: sessionContext.ip,
    roles: Array.from(sessionContext.roles).join(';'),
    raw: sessionContext.raw
  };

  if (sessionContext.expiresAt) {
    d['expiresAt'] = sessionContext.expiresAt.valueOf().toString();
  }

  if (sessionContext.resources) {
    d['resources'] = Array.from(sessionContext.resources).join(';');
  }

  return d;
};

const generateSecureRandomString = (n: number): string => {
  return randomBytes(n).toString('hex');
};
