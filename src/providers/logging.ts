import winston from 'winston';
import { Syslog } from 'winston-syslog';
import os from 'os';

import {
  LogLevel,
  LogSyslogEnabled,
  LogSyslogHost,
  LogSyslogPort
} from './config';

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

  if (LogSyslogEnabled) {
    l.info(`syslog logger enabled, endpoint - ${LogSyslogHost}:${LogSyslogPort}`);

    l.add(new Syslog({
      localhost: os.hostname(),
      appName: 'ts-express',

      protocol: 'udp',
      host: LogSyslogHost,
      port: LogSyslogPort,

      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));
  }

  return l;
})();
