import dotenv from 'dotenv';
import fs from 'fs';

const parseBoolean = (s: string | undefined): boolean => {
  return s && ['1', 'true', 'yes'].includes(s.toLocaleLowerCase());
};

const resolveSecret = (plaintextEnv: string | undefined, fileEnv: string | undefined): string | undefined => {
  if (plaintextEnv) {
    return plaintextEnv;
  }

  if (fileEnv) {
    try {
      const content = fs.readFileSync(fileEnv, { encoding: 'utf8' });
      if (content) {
        return content;
      }
    } catch (err) {
    }
  }

  return undefined;
};

dotenv.config({ path: process.env.CONFIG_PATH });

export const Mode = process.env.NODE_ENV || 'development';

export const LogLevel = process.env.LOG_LEVEL || 'info';
export const LogSyslogEnabled = parseBoolean(process.env.LOG_SYSLOG_ENABLED);
export const LogSyslogHost = process.env.LOG_SYSLOG_HOST || '127.0.0.1';
export const LogSyslogPort = parseInt(process.env.LOG_SYSLOG_PORT) || 514;

export const ServerPort = parseInt(process.env.SERVER_PORT) || 5000;
export const ServerHost = process.env.SERVER_HOST || '0.0.0.0';
export const BehindTLSProxy = parseBoolean(process.env.BEHIND_TLS_PROXY);
export const RatelimiterEnabled = parseBoolean(process.env.RATELIMITER_ENABLED);

export const DatabaseURI = resolveSecret(process.env.DATABASE_URI, process.env.DATABASE_URI_FILE);
if (!DatabaseURI) {
  throw new Error('DATABASE_URI is missing');
}
export const DatabaseQueryLogging = parseBoolean(process.env.DATABASE_QUERY_LOGGING);
export const DatabasePoolMax = parseInt(process.env.DATABASE_POOL_MAX) || 5;
export const DatabasePoolMin = parseInt(process.env.DATABASE_POOL_MIN) || 0;
export const DatabasePoolAcquireMs = parseInt(process.env.DATABASE_POOL_ACQUIRE_MS) || 30000;
export const DatabasePoolIdleMs = parseInt(process.env.DATABASE_POOL_IDLE_MS) || 10000;

export const RedisHost = process.env.REDIS_HOST;
if (!RedisHost) {
  throw new Error('REDIS_HOST is missing');
}
export const RedisPort = parseInt(process.env.REDIS_PORT) || 6379;
export const RedisPassword = resolveSecret(process.env.REDIS_PASSWORD, process.env.REDIS_PASSWORD_FILE);
export const RedisTLS = parseBoolean(process.env.REDIS_TLS);
