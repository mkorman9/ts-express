import dayjs from 'dayjs';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

import Session from '../models/session';
import Account from '../models/account';
import PasswordCredentials from '../models/password_credentials';
import GithubCredentials from '../models/github_credentials';

export interface NewSessionProps {
  ip?: string;
  duration?: number;
  roles?: string[];
}

class SessionProvider {
  private static readonly SessionIdLength = 24;
  private static readonly SessionTokenLength = 48;

  async findById(id: string): Promise<Session | null> {
    return await Session.findOne({
      where: {
        [Op.and]: [{
          id: id
        }, {
          [Op.or]: [{
            expiresAt: null
          }, {
            expiresAt: {
              [Op.gte]: dayjs().toDate()
            }
          }]
        }]
      },
      include: [{
        model: Account,
        include: [
          PasswordCredentials,
          GithubCredentials
        ]
      }]
    });
  }

  async findByToken(token: string): Promise<Session | null> {
    return await Session.findOne({
      where: {
        [Op.and]: [{
          token: token
        }, {
          [Op.or]: [{
            expiresAt: null
          }, {
            expiresAt: {
              [Op.gte]: dayjs().toDate()
            }
          }]
        }]
      },
      include: [{
        model: Account,
        include: [
          PasswordCredentials,
          GithubCredentials
        ]
      }]
    });
  }

  async startSession(account: Account, props: NewSessionProps = {}): Promise<Session> {
    const now = dayjs();
    const session = await Session.create({
      id: await SessionProvider.generateSecureRandomString(SessionProvider.SessionIdLength),
      accountId: account.id,
      token: await SessionProvider.generateSecureRandomString(SessionProvider.SessionTokenLength),
      rolesString: (props.roles || []).join(';'),
      ip: props.ip,
      issuedAt: now,
      duration: (props.duration && props.duration > 0) ? props.duration : null,
      expiresAt: (props.duration && props.duration > 0) ? dayjs(now).add(props.duration, 'seconds').toDate() : null
    });

    session.account = account;

    return session;
  }

  async revokeSession(session: Session): Promise<boolean> {
    const deleted = await Session.destroy({
      where: {
        id: session.id
      }
    });

    return deleted > 0;
  }

  async refreshSession(session: Session): Promise<Session> {
    if (!session.expiresAt || !session.duration) {
      return session;
    }

    session.expiresAt = dayjs().add(session.duration, 'seconds').toDate();
    session.save();

    return session;
  }

  async deleteExpiredRecords() {
    await Session.destroy({
      where: {
        expiresAt: {
          [Op.lt]: dayjs().toDate()
        }
      }
    });
  }

  private static generateSecureRandomString(n: number): Promise<string> {
    return new Promise((resolve, reject) => {
      randomBytes(n, (err, buf) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(buf.toString('hex'));
      });
    });
  }
}

export default new SessionProvider();
