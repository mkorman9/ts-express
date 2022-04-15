import dayjs from 'dayjs';
import { Transaction } from 'sequelize';
import { randomBytes } from 'crypto';
import { Op } from 'sequelize';

import Session from '../models/session';
import Account from '../models/account';
import DB from '../../common/providers/db';

export interface NewSessionProps {
  ip?: string;
  duration?: number;
  roles?: string[];
}

class SessionProvider {
  private static readonly SessionIdLength = 24;
  private static readonly SessionTokenLength = 48;

  async findById(id: string): Promise<Session> {
    return await Session.findOne({
      where: {
        id: id,
        expiresAt: {
          [Op.or]: [{
            [Op.eq]: null
          }, {
            [Op.gte]: dayjs().toDate()
          }]
        }
      },
      include: [
        Account
      ]
    });
  }

  async findByToken(token: string): Promise<Session> {
    return await Session.findOne({
      where: {
        token: token,
        expiresAt: {
          [Op.or]: [{
            [Op.eq]: null
          }, {
            [Op.gte]: dayjs().toDate()
          }]
        }
      },
      include: [
        Account
      ]
    });
  }

  async startSession(account: Account, props: NewSessionProps = {}): Promise<Session> {
    const now = dayjs();

    return await DB.transaction(async (t: Transaction) => {
      const session = await Session.create({
        id: SessionProvider.generateSecureRandomString(SessionProvider.SessionIdLength),
        accountId: account.id,
        token: SessionProvider.generateSecureRandomString(SessionProvider.SessionTokenLength),
        rolesString: (props.roles || []).join(';'),
        ip: props.ip,
        issuedAt: now,
        duration: (props.duration && props.duration > 0) ? props.duration : null,
        expiresAt: (props.duration && props.duration > 0) ? dayjs(now).add(props.duration, 'seconds') : null
      }, {
        transaction: t
      });

      session.account = account;

      return session;
    });
  }

  async revokeSession(session: Session): Promise<boolean> {
    return await DB.transaction(async (t: Transaction) => {
      const deleted = await Session.destroy({
        where: {
          id: session.id
        },
        transaction: t
      });

      return deleted > 0;
    });
  }

  async refreshSession(session: Session): Promise<Session> {
    if (!session.expiresAt || !session.duration) {
      return session;
    }

    return await DB.transaction(async (t: Transaction) => {
      session.expiresAt = dayjs().add(session.duration, 'seconds');
      session.save({
        transaction: t
      });

      return session;
    });
  }

  async deleteExpiredRecords() {
    await DB.transaction(async (t: Transaction) => {
      await Session.destroy({
        where: {
          expiresAt: {
            [Op.lt]: dayjs().toDate()
          }
        },
        transaction: t
      });
    });
  }

  private static generateSecureRandomString(n: number): string {
    return randomBytes(n).toString('hex');
  }
}

export default new SessionProvider();
