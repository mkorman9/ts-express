import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';

import Account from '../models/account';
import sessionProvider from './session';
import PasswordCredentials from '../models/password_credentials';
import GithubCredentials from '../models/github_credentials';
import { sendMail, Language } from '../../common/providers/mail';
import DB from '../../common/providers/db';
import Session from '../models/session';

export enum AccountLanguage {
  EnUS = 'en-US',
  PlPL = 'pl-PL'
}

export interface AccountAddPayload {
  username: string;
  email: string;
  password: string;
  language: AccountLanguage;
}

export interface AccountAddProps {
  ip: string;
}

export interface AuthorizeByPasswordProps {
  prolongedSession: boolean;
  ip: string;
}

export class UsernameAlreadyInUseError extends Error {
}

export class EmailAlreadyInUseError extends Error {
}

export class AccountDoesNotExistError extends Error {
}

export class AccountNotMeantToBeActivatedError extends Error {
}

export class InvalidPasswordError extends Error {
}

export class InactiveAccountError extends Error {
}

export class AccountsProvider {
  private static readonly PasswordSaltRounds = 12;

  async findAccountById(id: string): Promise<Account | null> {
    try {
      return await Account.findOne({
        where: {
          id: id,
          isDeleted: false
        },
        include: [
          PasswordCredentials,
          GithubCredentials
        ]
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

  async authorizeByPassword(email: string, password: string, props: AuthorizeByPasswordProps): Promise<Session> {
    const account = await Account.findOne({
      where: {
        isDeleted: false
      },
      include: [{
          model: PasswordCredentials,
          where: {
            email: email
          }
        },
        GithubCredentials
      ]
    });

    if (!account || !account.passwordCredentials) {
      throw new AccountDoesNotExistError();
    }

    if (!account.isActive) {
      throw new InactiveAccountError();
    }

    const passwordMatch = await bcrypt.compare(password, account.passwordCredentials.passwordBcrypt);
    if (!passwordMatch) {
      throw new InvalidPasswordError();
    }

    return await sessionProvider.startSession(account, {
      ip: props.ip,
      duration: props.prolongedSession ? dayjs.duration(14, 'days').asSeconds() : dayjs.duration(4, 'hours').asSeconds(),
      roles: account.roles
    });
  }

  async addAccount(payload: AccountAddPayload, props: AccountAddProps): Promise<Account> {
    const id = uuidv4();
    const now = dayjs();

    try {
      return await DB.transaction(async (t: Transaction) => {
        const account = await Account.create({
          id: id,
          username: payload.username,
          rolesString: '',
          isActive: false,
          isDeleted: false,
          bannedUntil: dayjs.unix(0),
          language: payload.language,
          registeredAt: now,
          passwordCredentials: {
            accountId: id,
            email: payload.email,
            passwordBcrypt: await bcrypt.hash(payload.password, AccountsProvider.PasswordSaltRounds),
            lastChangeAt: now,
            lastChangeIp: props.ip,
            passwordResetCode: ''
          }
        }, {
          include: [
            PasswordCredentials
          ],
          transaction: t
        });

        await sendMail({
          to: payload.email,
          template: 'new_account',
          language: payload.language as Language,
          options: {
            username: payload.username,
            activationCode: account.id
          }
        });

        return account;
      });
    } catch (err) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        if (err.fields['username']) {
          throw new UsernameAlreadyInUseError();
        }
        if (err.fields['email']) {
          throw new EmailAlreadyInUseError();
        }
      }

      throw err;
    }
  }

  async activateAccount(accountId: string) {
    let account: Account | null;
    try {
      account = await this.findAccountById(accountId);
      if (!account) {
        throw new AccountDoesNotExistError();
      }
    } catch (err) {
      if (err.name === 'SequelizeDatabaseError' &&
        err.original &&
        err.original.code === '22P02') {  // invalid UUID format
        throw new AccountDoesNotExistError();
      } else {
        throw err;
      }
    }

    if (account.isActive || !account.passwordCredentials) {
      throw new AccountNotMeantToBeActivatedError();
    }

    account.isActive = true;
    await account.save();
  }
}

export default new AccountsProvider();
