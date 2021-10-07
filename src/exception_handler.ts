import { log } from './providers/logging';
import { ConfigurationError } from './providers/config';

process.on('uncaughtException', (err) => {
  if (err instanceof ConfigurationError) {
    log.error(`configuration error: ${err.message}`);
    process.exit(1);
  }

  log.error(`unhandled exception ${err.name}: ${err.message}`, { stack: err.stack });
});

process.on('unhandledRejection', (reason, p) => {
  log.error(`unhandled promise rejection ${p}: ${reason}`);
});
