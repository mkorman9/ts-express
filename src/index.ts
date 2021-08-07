import dotenv from 'dotenv';

import app from './app';
import { log } from './logging';

log.info(`starting up in '${process.env.NODE_ENV}' mode`);

dotenv.config();
const serverPort = parseInt(process.env.SERVER_PORT) || 5000;
const serverHost = process.env.SERVER_HOST || '0.0.0.0';

process.on('SIGINT', () => {
    process.exit(0);
});

app.listen(serverPort, serverHost, () => {
    log.info(`server listening on ${serverHost}:${serverPort}`);
});
