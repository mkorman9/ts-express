import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { captchaMiddleware } from '../../captcha/middlewares/captcha';
import { ratelimiterMiddleware } from '../../common/middlewares/rate_limiter';

import {
  tokenAuthMiddleware,
  includeSessionAccount,
  getSessionAccount
} from '../../session/middlewares/authorization';
import Account from '../models/account';
import accountsProvider, {
  EmailAlreadyInUseError,
  UsernameAlreadyInUseError
} from '../providers/accounts';

const AccountRegisterValidators = [
  body('username')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 3 }).withMessage('lt')
    .bail()
    .matches(/^[a-zA-Z\d ]+$/).withMessage('accountname'),
  body('email')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isEmail().withMessage('email'),
  body('password')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 3 }).withMessage('lt'),
  body('language')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isIn(['en-US', 'pl-PL']).withMessage('oneof')
];

const AccountActivateValidators = [
  body('accountID')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
];

const accountAPI = Router();

accountAPI.get(
  '/info',
  tokenAuthMiddleware(),
  includeSessionAccount(ctx => accountsProvider.findAccountById(ctx.subject)),
  async (req: Request, res: Response) => {
    const account = getSessionAccount<Account>(req);

    return res
      .status(200)
      .json({
        id: account.id,
        username: account.username,
        isActive: account.isActive,
        isBanned: account.isBanned,
        bannedUntil: account.isBanned ? account.bannedUntil : null,
        roles: account.roles,
        email: account.email,
        language: account.language,
        registeredAt: account.registeredAt,
        loginMethods: {
          emailAndPassword: {
            defined: account.passwordCredentials ? true : false
          },
          github: {
            defined: account.githubCredentials ? true : false
          }
        }
      });
  }
);

accountAPI.post(
  '/register/password',
  ratelimiterMiddleware('general'),
  ...AccountRegisterValidators,
  captchaMiddleware('captcha'),
  async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    try {
      await accountsProvider.addAccount({
        username: req.body['username'],
        email: req.body['email'],
        password: req.body['password'],
        language: req.body['language']
      }, {
        ip: req.ip
      });
    } catch (err) {
      if (err instanceof UsernameAlreadyInUseError) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'username',
              code: 'unique'
            }]
          });
      }
      if (err instanceof EmailAlreadyInUseError) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'email',
              code: 'unique'
            }]
          });
      }

      return next(err);
    }

    return res
      .status(200)
      .json({
        status: 'OK'
      });
  }
);

accountAPI.post(
  '/activate',
  ratelimiterMiddleware('general', { countStatusCodes: [400] }),
  ...AccountActivateValidators,
  async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    try {
      const account = await accountsProvider.findAccountById(req.body['accountID']);
      if (!account) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Account does not exist',
            causes: [{
              field: 'account',
              code: 'invalid'
            }]
          });
      }

      const ok = await accountsProvider.activateAccount(account);
      if (!ok) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Invalid account type',
            causes: [{
              field: 'account',
              code: 'invalid'
            }]
          });
      }

      return res
        .status(200)
        .json({
          status: 'OK'
        });
    } catch (err) {
      next(err);
    }
  }
);

export default accountAPI;
