import startExpiredSessionsJob from './security/jobs/delete_expired_sessions';
import startExpiredCaptchasJob from './captcha/jobs/delete_expired_captchas';

const JobsToStart = [
  startExpiredSessionsJob,
  startExpiredCaptchasJob
];

export const startJobs = () => {
  JobsToStart.forEach(job => job());
};
