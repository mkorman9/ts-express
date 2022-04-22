import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import bcrypt from 'bcrypt';
import { Transaction } from 'sequelize';
import Account from '../models/account';
import PasswordCredentials from '../models/password_credentials';
import GithubCredentials from '../models/github_credentials';
import { sendMail, Language } from '../../common/providers/mail';
import DB from '../../common/providers/db';

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

export class UsernameAlreadyInUseError extends Error {
}

export class EmailAlreadyInUseError extends Error {
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

  async findAccountByCredentialsEmail(email: string): Promise<Account | null> {
    const credentials = await PasswordCredentials.findOne({
      where: {
        email: email
      },
      include: [
        Account
      ]
    });

    if (!credentials) {
      return null;
    }

    return await Account.findOne({
      where: {
        id: credentials.accountId,
        isDeleted: false
      },
      include: [
        PasswordCredentials,
        GithubCredentials
      ]
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

  async activateAccount(account: Account): Promise<boolean> {
    if (account.isActive) {
      return false;
    }

    if (!account.passwordCredentials) {
      return false;
    }

    account.isActive = true;
    await account.save();

    return true;
  }
}

export default new AccountsProvider();
