import { Router, Request, Response, NextFunction } from 'express';

import { ratelimiterMiddleware } from '../../common/providers/rate_limiter';
import { generateCaptcha, getCaptchaAudio, getCaptchaImage } from '../providers/captcha';

const captchaAPI = Router();

captchaAPI.get(
  '/generate',
  ratelimiterMiddleware('general'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const captchaId = await generateCaptcha();
      return res
        .status(200)
        .json({
          id: captchaId
        });
    } catch (err) {
      next(err);
    }
  }
);

captchaAPI.get(
  '/image/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params['id'];

    let width = parseInt(req.query.width as string);
    if (Number.isNaN(width) || width <= 0 || width > 1000) {
      width = 250;
    }

    let height = parseInt(req.query.height as string);
    if (Number.isNaN(height) || height <= 0 || height > 1000) {
      height = 75;
    }

    try {
      const image = await getCaptchaImage(id, { width, height });
      if (!image) {
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
    const id = req.params['id'];

    let language = req.query.lang as string;
    if (!language) {
      language = 'en-US';
    }

    try {
      const audio = await getCaptchaAudio(id, { language });
      if (!audio) {
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
        .send(audio);
    } catch (err) {
      next(err);
    }
  }
);

export default captchaAPI;
