import { DataTypes, Model } from 'sequelize';
import moment from 'moment';
import type { Moment } from 'moment';

import DB from '../providers/db';

export interface ClientAttributes {
    id: string;
    gender: string;
    firstName: string;
    lastName: string;
    address: string;
    phoneNumber: string;
    email: string;
    birthDate: Moment | null;
    isDeleted: boolean;
}

interface ClientModel extends 
    Model<ClientAttributes, {}>,
    ClientAttributes {
}

export const Clients = DB.define<ClientModel>('clients', {
    id: {
        field: 'id',
        type: DataTypes.UUID,
        primaryKey: true
    },
    gender: {
        field: 'gender',
        type: 'CHAR(1)'
    },
    firstName: {
        field: 'first_name',
        type: DataTypes.STRING(255)
    },
    lastName: {
        field: 'last_name',
        type: DataTypes.STRING(255)
    },
    address: {
        field: 'home_address',
        type: DataTypes.STRING(1024)
    },
    phoneNumber: {
        field: 'phone_number',
        type: DataTypes.STRING(64)
    },
    email: {
        field: 'email',
        type: DataTypes.STRING(64)
    },
    birthDate: {
        field: 'birth_date',
        type: DataTypes.DATE,
        allowNull: true,
        get: function() {
            const value = this.getDataValue('birthDate');
            if (!value) {
                return null;
            }

            return moment(value);
        }
    },
    isDeleted: {
        field: 'deleted',
        type: DataTypes.BOOLEAN
    },
}, {
    timestamps: false,
    freezeTableName: true
});
