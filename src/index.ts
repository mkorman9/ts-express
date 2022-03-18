import config from './common/providers/config';
import './exception_handler';
import app from './app';
import log from './common/providers/logging';

import { initDB } from './common/providers/db';
import { initRedis } from './common/providers/redis';
import { initAMQP, closeAMQP } from './common/providers/amqp';

log.info(`starting up in '${config.mode}' mode`);

initDB()
  .then(() => {
    log.info('successfully connected to postgres');
  })
  .catch(err => {
    log.error(`failed to connect to postgres: ${err}`);
    process.exit(1);
  });

initRedis()
  .then(() => {
    log.info('successfully connected to redis');
  })
  .catch(err => {
    log.error(`failed to connect to redis: ${err}`);
    process.exit(1);
  });

initAMQP()
  .then(() => {
    log.info('successfully connected to amqp');
  })
  .catch(err => {
    log.error(`failed to connect to amqp: ${err}`);
    process.exit(1);
  });

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
