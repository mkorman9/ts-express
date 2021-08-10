import { Op } from 'sequelize';
import { Moment } from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'sequelize';

import DB from '../../providers/db';
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

export interface ClientAddPayload {
    gender?: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: Moment;
    creditCards: { number: string }[];
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

export const addClient = async (clientPayload: ClientAddPayload): Promise<Client> => {
    try {
        const id = uuidv4();

        return await Client.create({
            id: id,
            gender: clientPayload.gender || '-',
            firstName: clientPayload.firstName,
            lastName: clientPayload.lastName,
            address: clientPayload.address || '',
            phoneNumber: clientPayload.phoneNumber || '',
            email: clientPayload.email || '',
            birthDate: clientPayload.birthDate || null,
            isDeleted: false,
            creditCards: clientPayload.creditCards.map(cc => ({
                clientId: id,
                number: cc.number
            }))
        }, {
            include: [
                CreditCard
            ]
        });
    } catch (err) {
        throw err;
    }
};

export const deleteClientById = async (id: string): Promise<boolean> => {
    try {
        return await DB.transaction(async (t: Transaction) => {
            const client = await Client.findOne({
                where: {
                    id: id,
                    isDeleted: {
                        [Op.ne]: true
                    },
                },
                include: [
                    CreditCard
                ],
                transaction: t
            });

            if (!client) {
                return false;
            }

            client.isDeleted = true;
            await client.save({ transaction: t });

            return true;
        });
    } catch (err) {
        if (err.name === 'SequelizeDatabaseError' &&
            err.original &&
            err.original.code === '22P02') {  // invalid UUID format
            return false;
        } else {
            throw err;
        }
    }
};
