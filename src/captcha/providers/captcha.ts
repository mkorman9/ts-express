import { v4 as uuidv4 } from 'uuid';
import captchapng3 from 'captchapng3';
import axios from 'axios';

import redisClient from '../../common/providers/redis';

export interface GetCaptchaImageProps {
  width: number;
  height: number;
}

export interface GetCaptchaAudioProps {
  language: string;
}

const CaptchaCharset = '1234567890'.split('');
const CaptchaLength = 6;
const CaptchaExpirationSeconds = 30 * 60;  // 30 min
const CaptchaRedisPrefix = 'captcha';

export const generateCaptcha = async (): Promise<string> => {
  const id = uuidv4();
  let captchaValue = '';

  for (let i = 0; i < CaptchaLength; i++) {
    captchaValue += CaptchaCharset[Math.floor(Math.random() * CaptchaCharset.length)];
  }

  await redisClient.SETEX(`${CaptchaRedisPrefix}:${id}`, CaptchaExpirationSeconds, captchaValue);

  return id;
};

export const getCaptchaImage = async (id: string, props: GetCaptchaImageProps): Promise<Buffer | null> => {
  const result = await redisClient.get(`${CaptchaRedisPrefix}:${id}`);
  if (!result) {
    return null;
  }

  const captcha = new captchapng3(props.width, props.height, result.toString(), '#ffffff');
  return captcha.getBuffer();
};

export const getCaptchaAudio = async (id: string, props: GetCaptchaAudioProps): Promise<Buffer | null> => {
  const result = await redisClient.get(`${CaptchaRedisPrefix}:${id}`);
  if (!result) {
    return null;
  }

  const captchaValue = result.toString();

  let language = 'en';
  if (props.language === 'pl-PL') {
    language = 'pl';
  }

  let captchaValueToRead = '';
  if (language === 'en' || language === 'pl') {
    captchaValueToRead = captchaValue.split('').join(', ').toUpperCase();
  }

  const response = await axios.get(
    `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=${encodeURIComponent(captchaValueToRead)}&tl=${language}`,
    {
      responseType: 'arraybuffer'
    }
  );

  return response.data;
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
