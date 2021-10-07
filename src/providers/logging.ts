import winston from 'winston';
import { Syslog } from 'winston-syslog';
import os from 'os';

import config from './config';

export const log = (() => {
  const props = {
    level: config.logging?.level || 'info',
    syslog: {
      enabled: config.logging?.syslog?.host !== undefined && config.logging?.syslog?.port !== undefined,
      host: config.logging?.syslog?.host || '127.0.0.1',
      port: config.logging?.syslog?.port || 514
    }
  };

  const l = winston.createLogger({
    level: props.level,
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(l => `${l.timestamp} | ${l.level} | ${l.message}`)
    )
  });

  if (props.syslog.enabled) {
    l.info(`syslog logger enabled, endpoint - ${props.syslog.host}:${props.syslog.port}`);

    l.add(new Syslog({
      localhost: os.hostname(),
      appName: 'ts-express',

      protocol: 'udp',
      host: props.syslog.host,
      port: props.syslog.port,

      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));
  }

  return l;
})();
