import { v4 as uuidv4 } from 'uuid';
import captchapng3 from 'captchapng3';
import axios from 'axios';
import dayjs from 'dayjs';
import { Op, Transaction } from 'sequelize';

import Captcha from '../models/captcha';
import DB from '../../common/providers/db';

export interface GetCaptchaImageProps {
  width: number;
  height: number;
}

export interface GetCaptchaAudioProps {
  language: string;
}

const CaptchaCharset = '1234567890'.split('');
const CaptchaLength = 6;
const CaptchaExpirationMinutes = 30;

export const generateCaptcha = async (): Promise<string> => {
  const id = uuidv4();
  const now = dayjs();

  let code = '';
  for (let i = 0; i < CaptchaLength; i++) {
    code += CaptchaCharset[Math.floor(Math.random() * CaptchaCharset.length)];
  }

  await DB.transaction(async (t: Transaction) => {
    await Captcha.create({
      id: id,
      code: code,
      createdAt: now,
      expiresAt: dayjs(now).add(CaptchaExpirationMinutes, 'minutes')
    }, {
      transaction: t
    });
  });

  return id;
};

export const getCaptchaImage = async (id: string, props: GetCaptchaImageProps): Promise<Buffer | null> => {
  const result = await findCaptcha(id);
  if (!result) {
    return null;
  }

  const captcha = new captchapng3(props.width, props.height, result.toString(), '#ffffff');
  return captcha.getBuffer();
};

export const getCaptchaAudio = async (id: string, props: GetCaptchaAudioProps): Promise<Buffer | null> => {
  const result = await findCaptcha(id);
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
  const result = await findCaptcha(id);
  if (!result) {
    return false;
  }

  await DB.transaction(async (t: Transaction) => {
    await Captcha.destroy({
      where: {
        id: id
      },
      transaction: t
    });
  });

  const code = result.toString();
  return answer === code;
};

const findCaptcha = async (id: string): Promise<Captcha> => {
  try {
    return await Captcha.findOne({
      where: {
        id: id,
        expiresAt: {
          [Op.gte]: dayjs().toDate()
        }
      }
    });
  } catch (err) {
    if (err.name === 'SequelizeDatabaseError' &&
      err.original &&
      err.original.code === '22P02') {  // invalid UUID format
      return null;
    } else {
      throw err;
    }
  }
};
