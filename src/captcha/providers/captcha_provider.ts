import { v4 as uuidv4 } from 'uuid';
import captcha from 'nodejs-captcha';

import redisClient from '../../providers/redis';

export interface GetCaptchaImageProps {
  width: number;
  height: number;
}

const CaptchaCharset = '1234567890abcdefghijklmnoprstuvyz'.split('');
const CaptchaLength = 5;
const CaptchaExpirationSeconds = 30 * 60;  // 30 min
const CaptchaRedisPrefix = 'captcha';

export const generateCaptcha = async (): Promise<string> => {
  const id = uuidv4();
  let captchaValue = '';

  for (let i = 0; i < CaptchaLength; i++) {
    captchaValue += CaptchaCharset[Math.floor(Math.random() * CaptchaCharset.length)];
  }

  await redisClient.setex(`${CaptchaRedisPrefix}:${id}`, CaptchaExpirationSeconds, captchaValue);

  return id;
};

export const getCaptchaImage = async (id: string, props: GetCaptchaImageProps): Promise<Buffer | null> => {
  const result = await redisClient.get(`${CaptchaRedisPrefix}:${id}`);
  if (!result) {
    return null;
  }

  const captchaValue = result.toString();

  const captchaObj = captcha({
    value: captchaValue,
    length: captchaValue.length,
    width: props.width,
    height: props.height
  });
  const data = captchaObj.image.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(data, 'base64');
};

export const verifyCaptchaAnswer = async (id: string, answer: string): Promise<boolean> => {
  const result = await redisClient.get(`${CaptchaRedisPrefix}:${id}`);
  if (!result) {
    return false;
  }

  await redisClient.del(`${CaptchaRedisPrefix}:${id}`);

  const captchaValue = result.toString();
  return answer === captchaValue;
};
