import { DataTypes } from 'sequelize';
import { Table, Column, Model } from 'sequelize-typescript';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';

@Table({ tableName: 'captchas', freezeTableName: true, timestamps: false })
class Captcha extends Model {
  @Column({ field: 'id', type: DataTypes.UUID, primaryKey: true })
  id: string;

  @Column({ field: 'code', type: DataTypes.STRING(6) })
  code: string;

  @Column({
    field: 'created_at',
    type: DataTypes.DATE,
    get: function () {
      const value = this.getDataValue('createdAt');
      return dayjs(value);
    }
  })
  createdAt: Dayjs;

  @Column({
    field: 'expires_at',
    type: DataTypes.DATE,
    get: function () {
      const value = this.getDataValue('expiresAt');
      return dayjs(value);
    }
  })
  expiresAt: Dayjs;
}

export default Captcha;
