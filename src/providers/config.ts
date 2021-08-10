import dotenv from 'dotenv';

const parseBoolean = (s: string | undefined): boolean => {
    return s && ['1', 'true', 'yes'].includes(s.toLocaleLowerCase());
};

dotenv.config();

export const LogLevel = process.env.LOG_LEVEL || 'info';

export const ServerPort = parseInt(process.env.SERVER_PORT) || 5000;
export const ServerHost = process.env.SERVER_HOST || '0.0.0.0';

export const DatabaseURI = process.env.DATABASE_URI;
if (!DatabaseURI) {
    throw new Error('DATABASE_URI is missing');
}
export const DatabaseQueryLogging = parseBoolean(process.env.DATABASE_QUERY_LOGGING);
export const DatabasePoolMax = parseInt(process.env.DATABASE_POOL_MAX) || 5;
export const DatabasePoolMin = parseInt(process.env.DATABASE_POOL_MIN) || 0;
export const DatabasePoolAcquireMs = parseInt(process.env.DATABASE_POOL_ACQUIRE_MS) || 30000;
export const DatabasePoolIdleMs = parseInt(process.env.DATABASE_POOL_IDLE_MS) || 10000;
