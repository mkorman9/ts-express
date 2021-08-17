import { ServerPort, ServerHost } from './providers/config';
import app from './app';
import { log } from './providers/logging';

import { testDBConnection } from './providers/db';
import { testRedisConnection } from './providers/redis';

log.info(`starting up in '${process.env.NODE_ENV}' mode`);

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

process.on('SIGINT', () => {
  process.exit(0);
});

app.listen(ServerPort, ServerHost, () => {
  log.info(`server listening on ${ServerHost}:${ServerPort}`);
});
