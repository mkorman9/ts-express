import { Router, Request, Response } from 'express';

import {
  tokenAuthMiddleware,
  includeSessionAccount,
  getSessionAccount
} from '../../session/middlewares/authorization';
import Account from '../models/account';
import { findAccountById } from '../providers/accounts';

const accountAPI = Router();

accountAPI.get(
  '/info',
  tokenAuthMiddleware(),
  includeSessionAccount(ctx => findAccountById(ctx.subject)),
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

export default accountAPI;
