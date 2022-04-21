import { DataTypes } from 'sequelize';
import { Table, Column, Model, BelongsTo, ForeignKey } from 'sequelize-typescript';

import Account from './account';

@Table({ tableName: 'accounts_credentials_github', freezeTableName: true, timestamps: false })
class GithubCredentials extends Model {
  @ForeignKey(() => Account)
  @Column({ field: 'account_id', type: DataTypes.UUID, primaryKey: true })
  accountId: string;

  @BelongsTo(() => Account, 'accountId')
  account: Account;

  @Column({ field: 'github_account_id', type: DataTypes.STRING(255), unique: true })
  githubAccountId: string;

  @Column({ field: 'email', type: DataTypes.STRING(255) })
  email: string;

  @Column({ field: 'github_username', type: DataTypes.STRING(255) })
  githubUsername: string;

  @Column({ field: 'profile_url', type: DataTypes.STRING(255) })
  profileUrl: string;

  @Column({ field: 'access_token', type: DataTypes.STRING(255) })
  accessToken: string;

  @Column({ field: 'last_access', type: DataTypes.DATE, allowNull: true })
  lastAccessTime: Date | null;

  @Column({ field: 'last_access_ip', type: DataTypes.STRING(255) })
  lastAccessIp: string;
}

export default GithubCredentials;
