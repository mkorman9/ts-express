import { scheduleJob } from 'node-schedule';

import sessionProvider from '../providers/session';
import log from '../../common/providers/logging';
import { advisoryLock } from '../../common/providers/db';

const ExpiredSessionsLockID = 1000;

const startExpiredSessionsJob = () => {
  log.info('starting Expired Sessions job');

  scheduleJob('*/30 * * * *', () => {
    log.info('Expired Sessions job has been triggered');

    advisoryLock(ExpiredSessionsLockID, async () => {
      log.info('acquired advisory lock for Expired Sessions job');

      try {
        await sessionProvider.deleteExpiredRecords();
        log.info('Expired Sessions job executed successfully');
      } catch (err) {
        log.error(`Expired Sessions job have failed: ${err}`);
      }
    });
  });
};

export default startExpiredSessionsJob;
