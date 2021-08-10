import { Op } from 'sequelize';
// import { v4 as uuidv4 } from 'uuid';

import Client from '../models/client';
import CreditCard from '../models/credit_card';

export enum FindClientsSortFields {
    id = 'id',
    gender = 'gender',
    firstName = 'firstName',
    lastName = 'lastName',
    address = 'address',
    phoneNumber = 'phoneNumber',
    email = 'email',
    birthDate = 'birthDate'
}

export interface FindClientsPagedOptions {
    pageNumber?: number;
    pageSize?: number;

    sortBy?: FindClientsSortFields;
    sortReverse?: boolean;
}

export const findClientsPaged = async (opts?: FindClientsPagedOptions): Promise<{rows: Client[], count: number}> => {
    const options: FindClientsPagedOptions = {
        pageNumber: opts.pageNumber || 0,
        pageSize: opts.pageSize || 10,

        sortBy: opts.sortBy || FindClientsSortFields.id,
        sortReverse: opts.sortReverse || false
    };

    try {
        return await Client.findAndCountAll({
            limit: options.pageSize,
            offset: options.pageSize * options.pageNumber,
            where: {
                isDeleted: {
                    [Op.ne]: true
                }
            },
            order: [
                [options.sortBy, options.sortReverse ? 'DESC' : 'ASC']
            ],
            include: [
                CreditCard
            ]
        });
    } catch (err) {
        throw err;
    }
};

export const findClientById = async (id: string): Promise<Client | null> => {
    try {
        return await Client.findOne({
            where: {
                id: id,
                isDeleted: {
                    [Op.ne]: true
                }
            },
            include: [
                CreditCard
            ]
        });
    } catch (err) {
        if (err.name === 'SequelizeDatabaseError' &&
            err.original &&
            err.original.code === '22P02') {  // invalid UUID format
            return null;
        } else {
            throw err;
        }
    }
};

export const addClient = async() => {
    /*
        let client = await Client.create({
            id: uuidv4(),
            gender: '-',
            firstName: 'ZZZ',
            lastName: 'ZZZ',
            address: '',
            phoneNumber: '',
            email: '',
            birthDate: null,
            isDeleted: false,
            creditCards: []
        });
    */
};
