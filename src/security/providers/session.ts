import dayjs from 'dayjs';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

import Session from '../models/session';
import Account from '../models/account';

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
      include: [
        Account
      ]
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
      include: [
        Account
      ]
    });
  }

  async startSession(account: Account, props: NewSessionProps = {}): Promise<Session> {
    const now = dayjs();
    const session = await Session.create({
      id: SessionProvider.generateSecureRandomString(SessionProvider.SessionIdLength),
      accountId: account.id,
      token: SessionProvider.generateSecureRandomString(SessionProvider.SessionTokenLength),
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

  private static generateSecureRandomString(n: number): string {
    return randomBytes(n).toString('hex');
  }
}

export default new SessionProvider();
