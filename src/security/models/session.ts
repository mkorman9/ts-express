import { DataTypes } from 'sequelize';
import { Table, Column, Model, ForeignKey, BelongsTo } from 'sequelize-typescript';

import Account from './account';

@Table({ tableName: 'sessions', freezeTableName: true, timestamps: false })
class Session extends Model {
  @Column({ field: 'id', type: DataTypes.STRING(64), primaryKey: true })
  id: string;

  @ForeignKey(() => Account)
  @Column({ field: 'account_id', type: DataTypes.UUID })
  accountId: string;

  @BelongsTo(() => Account, 'accountId')
  account: Account;

  @Column({ field: 'token', type: DataTypes.STRING(128), unique: true })
  token: string;

  @Column({ field: 'roles', type: DataTypes.STRING(1024) })
  rolesString: string;

  @Column({ field: 'ip', type: DataTypes.STRING(64) })
  ip: string;

  @Column({ field: 'issued_at', type: DataTypes.DATE })
  issuedAt: Date;

  @Column({ field: 'duration', type: DataTypes.INTEGER, allowNull: true })
  duration: number;

  @Column({ field: 'expires_at', type: DataTypes.DATE, allowNull: true })
  expiresAt: Date | null;

  get roles(): Set<string> {
    if (!this.rolesString) {
      return new Set([]);
    }

    return new Set(this.rolesString.split(';'));
  }
}

export default Session;
