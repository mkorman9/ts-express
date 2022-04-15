import { DataTypes } from 'sequelize';
import { Table, Column, Model, BelongsTo, ForeignKey } from 'sequelize-typescript';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import Account from './account';

@Table({ tableName: 'accounts_credentials_email_password', freezeTableName: true, timestamps: false })
class PasswordCredentials extends Model {
  @ForeignKey(() => Account)
  @Column({ field: 'account_id', type: DataTypes.UUID, primaryKey: true })
  accountId: string;

  @BelongsTo(() => Account, 'accountId')
  account: Account;

  @Column({ field: 'email', type: DataTypes.STRING(255), unique: true })
  email: string;

  @Column({ field: 'password_bcrypt', type: DataTypes.STRING(255) })
  passwordBcrypt: string;

  @Column({
    field: 'last_change_at',
    type: DataTypes.DATE,
    allowNull: true,
    get: function () {
      const value = this.getDataValue('lastChangeAt');
      if (!value) {
        return null;
      }

      return dayjs(value);
    }
  })
  lastChangeAt: Dayjs | null;

  @Column({ field: 'last_change_ip', type: DataTypes.STRING(255) })
  lastChangeIp: string;

  @Column({ field: 'password_reset_code', type: DataTypes.STRING(255) })
  passwordResetCode: string;
}

export default PasswordCredentials;
