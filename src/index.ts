import config from './common/providers/config';
import './exception_handler';
import log from './common/providers/logging';

import { initDB } from './common/providers/db';
import { initRedis } from './common/providers/redis';
import { initAMQP, closeAMQP } from './common/providers/amqp';

import type { Application } from 'express';

log.info(`starting up in '${config.mode}' mode`);

const createApp = async (): Promise<Application> => {
  try {
    await initDB();
    log.info('successfully connected to postgres');
  } catch (err) {
    log.error(`failed to connect to postgres: ${err}`);
    throw err;
  }

  try {
    await initRedis();
    log.info('successfully connected to redis');
  } catch (err) {
    log.error(`failed to connect to postgres: ${err}`);
    throw err;
  }

  try {
    await initAMQP();
    log.info('successfully connected to amqp');
  } catch (err) {
    log.error(`failed to connect to amqp: ${err}`);
    throw err;
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./app').default;
};

createApp()
  .then(app => {
    const props = {
      address: config.server?.address || '0.0.0.0',
      port: config.server?.port || 5000
    };
    const server = app.listen(props.port, props.address, () => {
      log.info(`server listening on ${props.address}:${props.port}`);
    });

    process.on('SIGINT', () => {
      server.close(() => {
        log.info('server stopped due to signal');

        closeAMQP()
          .then(() => {
            process.exit(0);
          })
          .catch(err => {
            log.error(`failed to close amqp connection: ${err}`);
            process.exit(1);
          });
      });
    });
  })
  .catch(() => {
    process.exit(1);
  });
