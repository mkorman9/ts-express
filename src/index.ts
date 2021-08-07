import { ServerPort, ServerHost } from './providers/config';
import app from './app';
import { log } from './providers/logging';

import './providers/db';

log.info(`starting up in '${process.env.NODE_ENV}' mode`);

process.on('SIGINT', () => {
    process.exit(0);
});

app.listen(ServerPort, ServerHost, () => {
    log.info(`server listening on ${ServerHost}:${ServerPort}`);
});
