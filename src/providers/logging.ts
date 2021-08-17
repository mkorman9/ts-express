import winston from 'winston';

import { LogLevel } from './config';

export const log = (() => {
  return winston.createLogger({
    level: LogLevel,
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(l => `${l.timestamp} | ${l.level} | ${l.message}`)
    )
  });
})();
