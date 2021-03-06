import config from './common/providers/config';
import './exception_handler';
import log from './common/providers/logging';

import { initDB, closeDB } from './common/providers/db';
import { initAMQP, closeAMQP } from './common/providers/amqp';
import { startJobs, stopJobs } from './jobs';

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
      port: config.server?.port || 8080
    };
    const server = app.listen(props.port, props.address, () => {
      log.info(`server listening on ${props.address}:${props.port}`);
    });

    process.on('SIGINT', () => {
      server.close(async () => {
        log.info('server stopped due to signal');

        await stopJobs();

        try {
          await closeAMQP();
        } catch (err) {
          log.warn(`failed to close amqp connection: ${err}`);
        }

        try {
          await closeDB();
        } catch (err) {
          log.warn(`failed to close postgres connection: ${err}`);
        }

        process.exit(0);
      });
    });

    startJobs();
  })
  .catch((err) => {
    log.error(`failed to initialize app: ${err}`, { stack: err.stack });
    process.exit(1);
  });
