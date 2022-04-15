import { DataTypes } from 'sequelize';
import { Table, Column, Model, HasMany } from 'sequelize-typescript';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

import CreditCard from './credit_card';

@Table({ tableName: 'clients', freezeTableName: true, timestamps: false })
class Client extends Model {
  @Column({ field: 'id', type: DataTypes.UUID, primaryKey: true })
  id: string;

  @Column({ field: 'gender', type: 'CHAR(1)' })
  gender: string;

  @Column({ field: 'first_name', type: DataTypes.STRING(255) })
  firstName: string;

  @Column({ field: 'last_name', type: DataTypes.STRING(255) })
  lastName: string;

  @Column({ field: 'home_address', type: DataTypes.STRING(1024) })
  address: string;

  @Column({ field: 'phone_number', type: DataTypes.STRING(64) })
  phoneNumber: string;

  @Column({ field: 'email', type: DataTypes.STRING(64) })
  email: string;

  @Column({
    field: 'birth_date',
    type: DataTypes.DATE,
    allowNull: true,
    get: function () {
      const value = this.getDataValue('birthDate');
      if (!value) {
        return null;
      }

      return dayjs(value);
    }
  })
  birthDate: Dayjs | null;

  @Column({ field: 'deleted', type: DataTypes.BOOLEAN })
  isDeleted: boolean;

  @HasMany(() => CreditCard, 'clientId')
  creditCards: CreditCard[];
}

export default Client;
