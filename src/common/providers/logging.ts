import winston from 'winston';
import { Syslog } from 'winston-syslog';
import os from 'os';

import config from './config';

const createLogger = () => {
  const props = {
    level: config.logging?.level || 'info',
    syslog: {
      enabled: config.logging?.syslog?.host !== undefined && config.logging?.syslog?.port !== undefined,
      host: config.logging?.syslog?.host || '127.0.0.1',
      port: config.logging?.syslog?.port || 514
    }
  };

  const logger = winston.createLogger({
    level: props.level,
    transports: [
      new winston.transports.Console()
    ],
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        l => l.stack ? `${l.timestamp} | ${l.level} | ${l.message}\n${l.stack}` : `${l.timestamp} | ${l.level} | ${l.message}`
      )
    )
  });

  if (props.syslog.enabled) {
    logger.info(`syslog logger enabled, endpoint - ${props.syslog.host}:${props.syslog.port}`);

    logger.add(new Syslog({
      localhost: os.hostname(),
      app_name: 'ts-express',

      protocol: 'udp',
      host: props.syslog.host,
      port: props.syslog.port,

      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }));
  }

  return logger;
};

export default createLogger();
