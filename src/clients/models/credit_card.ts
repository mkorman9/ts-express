import { DataTypes } from 'sequelize';
import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';

import Client from './client';

@Table({ tableName: 'clients_credit_cards', freezeTableName: true, timestamps: false })
class CreditCard extends Model {
    @ForeignKey(() => Client)
    @Column({ field: 'client_id', type: DataTypes.UUID, primaryKey: true })
    clientId: string;

    @Column({ field: 'number', type: DataTypes.STRING(32), primaryKey: true })
    number: string;
}

export default CreditCard;
