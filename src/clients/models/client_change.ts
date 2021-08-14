import { DataTypes } from 'sequelize';
import { Table, Column, Model, ForeignKey } from 'sequelize-typescript';
import moment from 'moment';
import type { Moment } from 'moment';

import Client from './client';

@Table({ tableName: 'clients_changes', freezeTableName: true, timestamps: false })
class ClientChange extends Model {
    @Column({ field: 'id', type: DataTypes.UUID, primaryKey: true })
    id: string;

    @ForeignKey(() => Client)
    @Column({ field: 'client_id', type: DataTypes.UUID, primaryKey: true })
    clientId: string;

    @Column({ field: 'change_type', type: DataTypes.STRING(64) })
    type: string;

    @Column({
        field: 'change_timestamp',
        type: DataTypes.DATE,
        allowNull: true,
        get: function() {
            const value = this.getDataValue('timestamp');
            if (!value) {
                return null;
            }

            return moment(value);
        }
    })
    timestamp: Moment;

    @Column({ field: 'author', type: DataTypes.UUID })
    author: string;

    @Column({ field: 'changeset', type: DataTypes.TEXT })
    changeset: string;
}

export default ClientChange;
