import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';
import { getRequestQuery, requestQueryMiddleware } from '../../common/middlewares/validation';
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
  requestQueryMiddleware(GetCaptchaImageQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const query = getRequestQuery<GetCaptchaImageQuery>(req);

    try {
      const captchaImage = await captchaProvider.getImage(id, {
        width: query.width,
        height: query.height
      });
      if (!captchaImage) {
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

      return res
        .status(200)
        .contentType('image/png')
        .header('Cache-Control', `max-age=${captchaImage.expiresIn}, must-revalidate`)
        .send(captchaImage.data);
    } catch (err) {
      next(err);
    }
  }
);

captchaAPI.get(
  '/audio/:id',
  ratelimiterMiddleware('general'),
  requestQueryMiddleware(GetCaptchaAudioQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const query = getRequestQuery<GetCaptchaAudioQuery>(req);

    try {
      const captchaAudio = await captchaProvider.getAudio(id, {
        language: query.language
      });
      if (!captchaAudio) {
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

      return res
        .status(200)
        .contentType('audio/mpeg')
        .header('Cache-Control', `max-age=${captchaAudio.expiresIn}, must-revalidate`)
        .send(captchaAudio.data);
    } catch (err) {
      next(err);
    }
  }
);

export default captchaAPI;
