import { DataTypes } from 'sequelize';
import { Table, Column, Model } from 'sequelize-typescript';

@Table({ tableName: 'captchas', freezeTableName: true, timestamps: false })
class Captcha extends Model {
  @Column({ field: 'id', type: DataTypes.UUID, primaryKey: true })
  id: string;

  @Column({ field: 'code', type: DataTypes.STRING(6) })
  code: string;

  @Column({ field: 'created_at', type: DataTypes.DATE })
  createdAt: Date;

  @Column({ field: 'expires_at', type: DataTypes.DATE })
  expiresAt: Date;
}

export default Captcha;
