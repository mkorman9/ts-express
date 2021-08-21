import { Router, Request, Response, NextFunction } from 'express';

import {
  tokenAuthMiddleware,
  includeSessionAccount,
  getSessionAccount
} from '../../session/middlewares/authorization_middleware';
import Account from '../models/account';

const accountAPI = Router();

accountAPI.get(
  '/info',
  tokenAuthMiddleware(),
  includeSessionAccount(),
  async (req: Request, res: Response, next: NextFunction) => {
    const account = getSessionAccount(req) as Account;

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

export default accountAPI;
