import { v4 as uuidv4 } from 'uuid';
import captchapng3 from 'captchapng3';
import axios from 'axios';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

import Captcha from '../models/captcha';
import { isInvalidUUIDError } from '../../common/providers/db';

export interface GetCaptchaImageProps {
  width: number;
  height: number;
}

export enum CaptchaAudioLanguage {
  EnUS = 'en-US',
  PlPL = 'pl-PL'
}

export interface GetCaptchaAudioProps {
  language: CaptchaAudioLanguage;
}

export interface CaptchaImageData {
  data: Buffer;
  expiresIn: number;
}

export interface CaptchaAudioData {
  data: Buffer;
  expiresIn: number;
}

class CaptchaProvider {
  private static readonly CaptchaCharset = '1234567890'.split('');
  private static readonly CaptchaLength = 6;
  private static readonly CaptchaExpirationMinutes = 30;

  async generate(): Promise<Captcha> {
    const id = uuidv4();
    const now = dayjs();

    let code = '';
    for (let i = 0; i < CaptchaProvider.CaptchaLength; i++) {
      code += CaptchaProvider.CaptchaCharset[Math.floor(Math.random() * CaptchaProvider.CaptchaCharset.length)];
    }

    return await Captcha.create({
      id: id,
      code: code,
      createdAt: now,
      expiresAt: dayjs(now).add(CaptchaProvider.CaptchaExpirationMinutes, 'minutes').toDate()
    });
  }

  async getImage(id: string, props: GetCaptchaImageProps): Promise<CaptchaImageData | null> {
    const captcha = await this.findCaptcha(id);
    if (!captcha) {
      return null;
    }

    const image = new captchapng3(props.width, props.height, captcha.code, '#ffffff');
    return {
      data: image.getBuffer(),
      expiresIn: dayjs(captcha.expiresAt).diff(dayjs(), 'second')
    };
  }

  async getAudio(id: string, props: GetCaptchaAudioProps): Promise<CaptchaAudioData | null> {
    const captcha = await this.findCaptcha(id);
    if (!captcha) {
      return null;
    }

    const languageString = this.convertLanguageString(props.language);
    const captchaValueToRead = this.formatTextToSpeech(captcha.code, props.language);

    const response = await axios.get(
      `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=${encodeURIComponent(captchaValueToRead)}&tl=${languageString}`,
      {
        responseType: 'arraybuffer'
      }
    );

    return {
      data: response.data,
      expiresIn: dayjs(captcha.expiresAt).diff(dayjs(), 'second')
    };
  }

  async verifyAnswer(id: string, answer: string): Promise<boolean> {
    const result = await this.findCaptcha(id);
    if (!result) {
      return false;
    }

    await Captcha.destroy({
      where: {
        id: id
      }
    });

    return result.code === answer;
  }

  async deleteExpiredRecords() {
    await Captcha.destroy({
      where: {
        expiresAt: {
          [Op.lt]: dayjs().toDate()
        }
      }
    });
  }

  private async findCaptcha(id: string): Promise<Captcha | null> {
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
      if (isInvalidUUIDError(err)) {
        return null;
      } else {
        throw err;
      }
    }
  }

  private convertLanguageString(language: CaptchaAudioLanguage): string {
    if (language === CaptchaAudioLanguage.EnUS) {
      return 'en';
    } else if (language === CaptchaAudioLanguage.PlPL) {
      return 'pl';
    }

    return '';
  }

  private formatTextToSpeech(text: string, language: CaptchaAudioLanguage): string {
    if (
      language === CaptchaAudioLanguage.EnUS ||
      language === CaptchaAudioLanguage.PlPL
    ) {
      return text.split('').join(', ').toUpperCase();
    }

    return '';
  }
}

export default new CaptchaProvider();
