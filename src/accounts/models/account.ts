import { DataTypes } from 'sequelize';
import { Table, Column, Model, HasOne } from 'sequelize-typescript';
import moment from 'moment';
import type { Moment } from 'moment';

import PasswordCredentials from './password_credentials';
import GithubCredentials from './github_credentials';

@Table({ tableName: 'accounts', freezeTableName: true, timestamps: false })
class Account extends Model {
  @Column({ field: 'id', type: DataTypes.UUID, primaryKey: true })
  id: string;

  @Column({ field: 'username', type: DataTypes.STRING(255), unique: true })
  username: string;

  @Column({ field: 'roles', type: DataTypes.STRING(255) })
  rolesString: string;

  @Column({ field: 'active', type: DataTypes.BOOLEAN })
  isActive: boolean;

  @Column({ field: 'deleted', type: DataTypes.BOOLEAN })
  isDeleted: boolean;

  @Column({
    field: 'banned_until',
    type: DataTypes.DATE,
    allowNull: true,
    get: function () {
      const value = this.getDataValue('bannedUntil');
      if (!value) {
        return null;
      }

      return moment(value);
    }
  })
  bannedUntil: Moment | null;

  @Column({ field: 'preferred_language', type: DataTypes.STRING(32) })
  language: string;

  @Column({
    field: 'created_at',
    type: DataTypes.DATE,
    get: function () {
      const value = this.getDataValue('registeredAt');
      if (!value) {
        return null;
      }

      return moment(value);
    }
  })
  registeredAt: Moment;

  @HasOne(() => PasswordCredentials)
  passwordCredentials: PasswordCredentials | null;

  @HasOne(() => GithubCredentials)
  githubCredentials: GithubCredentials | null;

  get email(): string {
    if (this.passwordCredentials) {
      return this.passwordCredentials.email;
    }

    if (this.githubCredentials) {
      return this.githubCredentials.email;
    }

    return '';
  }

  get isBanned(): boolean {
    return this.bannedUntil && moment().isBefore(this.bannedUntil);
  }

  get roles(): string[] {
    if (!this.rolesString) {
      return [];
    }

    return this.rolesString.split(';');
  }
}

export default Account;
