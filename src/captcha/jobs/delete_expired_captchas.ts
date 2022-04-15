import { scheduleJob } from 'node-schedule';

import captchaProvider from '../providers/captcha';
import log from '../../common/providers/logging';
import { advisoryLock } from '../../common/providers/db';

const ExpiredCaptchasLockID = 1001;

const startExpiredCaptchasJob = () => {
  log.info('starting Expired Captchas job');

  scheduleJob('*/30 * * * *', () => {
    log.info('Expired Captchas job has been triggered');

    advisoryLock(ExpiredCaptchasLockID, async () => {
      log.info('acquired advisory lock for Expired Captchas job');

      try {
        await captchaProvider.deleteExpiredRecords();
        log.info('Expired Captchas job executed successfully');
      } catch (err) {
        log.error(`Expired Captchas job have failed: ${err}`);
      }
    });
  });
};

export default startExpiredCaptchasJob;
