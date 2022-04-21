import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';
import captchaProvider, { CaptchaAudioLanguage } from '../providers/captcha';

export const DefaultImageWidth = 250;
export const DefaultImageHeight = 75;
export const DefaultAudioLanguage = CaptchaAudioLanguage.EnUS;

const GetCaptchaImageQuerySchema = z.object({
  width: z
    .preprocess(arg => parseInt(arg as string), z.number())
    .transform(arg => {
      if (arg <= 0 || arg > 1000) {
        return DefaultImageWidth;
      }

      return arg;
    })
    .default(DefaultImageWidth),
  height: z
    .preprocess(arg => parseInt(arg as string), z.number())
    .transform(arg => {
      if (arg <= 0 || arg > 1000) {
        return DefaultImageHeight;
      }

      return arg;
    })
    .default(DefaultImageHeight)
});

type GetCaptchaImageQuery = z.infer<typeof GetCaptchaImageQuerySchema>;

const GetCaptchaAudioQuerySchema = z.object({
  language: z.nativeEnum(CaptchaAudioLanguage).default(DefaultAudioLanguage)
});

type GetCaptchaAudioQuery = z.infer<typeof GetCaptchaAudioQuerySchema>;

const captchaAPI = Router();

captchaAPI.get(
  '/generate',
  ratelimiterMiddleware('general'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const captcha = await captchaProvider.generate();
      return res
        .status(200)
        .json({
          id: captcha.id
        });
    } catch (err) {
      next(err);
    }
  }
);

captchaAPI.get(
  '/image/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    let query: GetCaptchaImageQuery;
    try {
      query = GetCaptchaImageQuerySchema.parse(req.query);
    } catch (err) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Malformed query params'
        });
    }

    try {
      const result = await captchaProvider.getImage(id, {
        width: query.width,
        height: query.height
      });
      if (!result) {
        return res
          .status(404)
          .json({
            status: 'error',
            causes: [{
              field: 'id',
              code: 'invalid'
            }]
          });
      }

      const [image, expiresIn] = result;

      return res
        .status(200)
        .contentType('image/png')
        .header('Cache-Control', `max-age=${expiresIn}, must-revalidate`)
        .send(image);
    } catch (err) {
      next(err);
    }
  }
);

captchaAPI.get(
  '/audio/:id',
  ratelimiterMiddleware('general'),
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;

    let query: GetCaptchaAudioQuery;
    try {
      query = GetCaptchaAudioQuerySchema.parse(req.query);
    } catch (err) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Malformed query params'
        });
    }

    try {
      const result = await captchaProvider.getAudio(id, {
        language: query.language
      });
      if (!result) {
        return res
          .status(404)
          .json({
            status: 'error',
            causes: [{
              field: 'id',
              code: 'invalid'
            }]
          });
      }

      const [audio, expiresIn] = result;

      return res
        .status(200)
        .contentType('audio/mpeg')
        .header('Cache-Control', `max-age=${expiresIn}, must-revalidate`)
        .send(audio);
    } catch (err) {
      next(err);
    }
  }
);

export default captchaAPI;
