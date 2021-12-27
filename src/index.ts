import config from './common/providers/config';
import './exception_handler';
import app from './app';
import { log } from './common/providers/logging';

import { testDBConnection } from './common/providers/db';
import { testRedisConnection } from './common/providers/redis';

log.info(`starting up in '${config.mode}' mode`);

testDBConnection()
  .then(() => {
    log.info('successfully connected to postgres');
  })
  .catch(err => {
    log.error(`failed to connect to postgres: ${err}`);
    process.exit(1);
  });

testRedisConnection()
  .then(() => {
    log.info('successfully connected to redis');
  })
  .catch(err => {
    log.error(`failed to connect to redis: ${err}`);
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
    process.exit(0);
  });
});
