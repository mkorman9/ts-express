import { v4 as uuidv4 } from 'uuid';
import captchapng3 from 'captchapng3';
import axios from 'axios';
import dayjs from 'dayjs';
import { Op } from 'sequelize';

import Captcha from '../models/captcha';

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

  async getImage(id: string, props: GetCaptchaImageProps): Promise<Buffer | null> {
    const result = await this.findCaptcha(id);
    if (!result) {
      return null;
    }

    const captcha = new captchapng3(props.width, props.height, result.toString(), '#ffffff');
    return captcha.getBuffer();
  }

  async getAudio(id: string, props: GetCaptchaAudioProps): Promise<Buffer | null> {
    const result = await this.findCaptcha(id);
    if (!result) {
      return null;
    }

    const captchaValue = result.toString();
    const languageString = this.convertLanguageString(props.language);
    const captchaValueToRead = this.formatTextToSpeech(captchaValue, props.language);

    const response = await axios.get(
      `http://translate.google.com/translate_tts?ie=UTF-8&total=1&idx=0&textlen=32&client=tw-ob&q=${encodeURIComponent(captchaValueToRead)}&tl=${languageString}`,
      {
        responseType: 'arraybuffer'
      }
    );

    return response.data;
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
      if (err.name === 'SequelizeDatabaseError' &&
        err.original &&
        err.original.code === '22P02') {  // invalid UUID format
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
