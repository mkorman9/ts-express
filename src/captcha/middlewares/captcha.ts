import { Request, Response, NextFunction } from 'express';
import { verifyCaptchaAnswer } from '../providers/captcha';

export interface CaptchaAnswer {
  id: string;
  answer: string;
}

export const captchaMiddleware = (fieldName: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body ||
        !req.body[fieldName] ||
        (typeof req.body[fieldName] !== 'object') ||
        !req.body[fieldName]['id'] ||
        !req.body[fieldName]['answer']) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Missing or malformed captcha answer',
          causes: {
            field: fieldName,
            code: 'captcha'
          }
        });
    }

    const captchaAnswer = req.body[fieldName] as CaptchaAnswer;
    try {
      const ok = await verifyCaptchaAnswer(captchaAnswer.id, captchaAnswer.answer);
      if (!ok) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Invalid captcha answer',
            causes: {
              field: fieldName,
              code: 'captcha'
            }
          });
      }
    } catch(err) {
      return next(err);
    }

    next();
  };
};
