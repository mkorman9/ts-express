import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';
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
  private static readonly SessionTokenLength = 48;

  async findById(id: string): Promise<Session> {
    try {
      return await Session.findOne({
        where: {
          id: id,
          expiresAt: {
            [Op.or]: [{
              [Op.eq]: null
            }, {
              [Op.gte]: moment().toDate()
            }]
          }
        },
        include: [
          Account
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

  async findByToken(token: string): Promise<Session> {
    return await Session.findOne({
      where: {
        token: token,
        expiresAt: {
          [Op.or]: [{
            [Op.eq]: null
          }, {
            [Op.gte]: moment().toDate()
          }]
        }
      },
      include: [
        Account
      ]
    });
  }

  async startSession(account: Account, props: NewSessionProps = {}): Promise<Session> {
    const id = uuidv4();
    const now = moment();

    return await DB.transaction(async (t: Transaction) => {
      const session = await Session.create({
        id: id,
        account: account,
        accountId: account.id,
        token: SessionProvider.generateSecureRandomString(SessionProvider.SessionTokenLength),
        rolesString: (props.roles || []).join(';'),
        ip: props.ip,
        issuedAt: now,
        duration: (props.duration && props.duration > 0) ? props.duration : null,
        expiresAt: (props.duration && props.duration > 0) ? moment(now).add(props.duration, 'seconds') : null
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
      session.expiresAt = moment().add(session.duration, 'seconds');
      session.save({
        transaction: t
      });

      return session;
    });
  }

  private static generateSecureRandomString(n: number): string {
    return randomBytes(n).toString('hex');
  }
}

export default new SessionProvider();
