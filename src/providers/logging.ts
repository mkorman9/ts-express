import winston from 'winston';
import WinstonGelfTransporter from 'winston-gelf-transporter';

import {
  LogLevel,
  LogGelfEnabled,
  LogGelfHost,
  LogGelfPort
} from './config';

interface GelfTransporterOptions {
  level?: string;
  silent?: boolean;
  handleExceptions?: boolean;
  version?: string;
  host?: string;
  port?: number;
  protocol?: string;
  hostName?: string;
  additional?: Object;
}

export const log = (() => {
  const l = winston.createLogger({
    level: LogLevel,
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(l => `${l.timestamp} | ${l.level} | ${l.message}`)
    )
  });

  if (LogGelfEnabled) {
    l.add(new WinstonGelfTransporter({
      level: LogLevel,
      hostName: process.env.HOST,
      protocol: 'udp',
      host: LogGelfHost,
      port: LogGelfPort,

      format: winston.format.printf(l => l.message)
    } as GelfTransporterOptions));
  }

  return l;
})();
