import { Op, WhereAttributeHash } from 'sequelize';
import moment, { Moment } from 'moment';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'sequelize';

import DB from '../../common/providers/db';
import Client from '../models/client';
import CreditCard from '../models/credit_card';
import ClientChange from '../models/client_change';
import { generateClientChangeset } from './clients_changes';

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

export interface FindClientsFilters {
  gender?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  bornAfter?: Moment;
  bornBefore?: Moment;
  creditCardNumber?: string;
}

export interface FindClientsPagedOptions {
  pageNumber?: number;
  pageSize?: number;

  sortBy?: FindClientsSortFields;
  sortReverse?: boolean;

  filters?: FindClientsFilters;
}

export interface FindClientByIdOptions {
  includeDeleted?: boolean;
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

export interface ClientUpdatePayload {
  gender?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: Moment | null;
  creditCards?: { number: string }[];
}

export interface AddClientProps {
  author: string;
}

export interface UpdateClientProps {
  author: string;
}

export interface DeleteClientProps {
  author: string;
}

export const findClientsPaged = async (opts?: FindClientsPagedOptions): Promise<{ rows: Client[], count: number }> => {
  const options: FindClientsPagedOptions = {
    pageNumber: opts.pageNumber || 0,
    pageSize: opts.pageSize || 10,

    sortBy: opts.sortBy || FindClientsSortFields.id,
    sortReverse: opts.sortReverse || false,

    filters: opts.filters || {}
  };

  const filters: WhereAttributeHash<unknown>[] = [];

  if (options.filters.gender) {
    filters.push({
      gender: options.filters.gender
    });
  }
  if (options.filters.firstName) {
    filters.push({
      firstName: {
        [Op.iLike]: `%${options.filters.firstName}%`
      }
    });
  }
  if (options.filters.lastName) {
    filters.push({
      lastName: {
        [Op.iLike]: `%${options.filters.lastName}%`
      }
    });
  }
  if (options.filters.address) {
    filters.push({
      address: {
        [Op.iLike]: `%${options.filters.address}%`
      }
    });
  }
  if (options.filters.phoneNumber) {
    filters.push({
      phoneNumber: {
        [Op.iLike]: `%${options.filters.phoneNumber}%`
      }
    });
  }
  if (options.filters.email) {
    filters.push({
      email: {
        [Op.iLike]: `%${options.filters.email}%`
      }
    });
  }
  if (options.filters.bornAfter) {
    filters.push({
      birthDate: {
        [Op.gte]: options.filters.bornAfter.toDate()
      }
    });
  }
  if (options.filters.bornBefore) {
    filters.push({
      birthDate: {
        [Op.lte]: options.filters.bornBefore.toDate()
      }
    });
  }
  if (options.filters.creditCardNumber) {
    const clientWithCreditCard = await CreditCard.findAll({
      where: {
        number: {
          [Op.like]: `%${options.filters.creditCardNumber}%`
        }
      }
    });

    filters.push({
      id: {
        [Op.in]: clientWithCreditCard.map(cc => cc.clientId)
      }
    });
  }

  return await Client.findAndCountAll({
    limit: options.pageSize,
    offset: options.pageSize * options.pageNumber,
    where: {
      [Op.and]: [{
        isDeleted: false
      }, {
        [Op.and]: [...filters]
      }]
    },
    order: [
      [options.sortBy, options.sortReverse ? 'DESC' : 'ASC']
    ],
    include: [
      CreditCard
    ]
  });
};

export const findClientById = async (id: string, findOptions?: FindClientByIdOptions): Promise<Client | null> => {
  const options = {
    includeDeleted: (findOptions?.includeDeleted === undefined) ? false : (findOptions?.includeDeleted === true)
  };

  const filters = {};
  if (!options.includeDeleted) {
    filters['isDeleted'] = {
      [Op.ne]: true
    };
  }

  try {
    return await Client.findOne({
      where: {
        id: id,
        ...filters
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

export const addClient = async (clientPayload: ClientAddPayload, props: AddClientProps): Promise<Client> => {
  const id = uuidv4();

  return await DB.transaction(async (t: Transaction) => {
    const client = await Client.create({
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
      ],
      transaction: t
    });

    const changeset = generateClientChangeset({}, client);
    await ClientChange.create({
      id: uuidv4(),
      clientId: id,
      type: 'CREATED',
      timestamp: moment(),
      author: props.author,
      changeset: JSON.stringify(changeset)
    }, {
      transaction: t
    });

    return client;
  });
};

export const updateClient = async (id: string, clientPayload: ClientUpdatePayload, props: UpdateClientProps): Promise<boolean> => {
  try {
    return await DB.transaction(async (t: Transaction) => {
      const client = await Client.findOne({
        where: {
          id: id,
          isDeleted: false
        },
        include: [
          CreditCard
        ],
        transaction: t
      });

      if (!client) {
        return false;
      }

      const originalClientData = {
        gender: client.gender,
        firstName: client.firstName,
        lastName: client.lastName,
        address: client.address,
        phoneNumber: client.phoneNumber,
        email: client.email,
        birthDate: client.birthDate ? moment(client.birthDate) : null,
        creditCards: (client.creditCards || []).map(cc => ({ number: cc.number }))
      };

      if (clientPayload.creditCards) {
        await CreditCard.destroy({
          where: {
            clientId: id
          },
          transaction: t
        });

        await CreditCard.bulkCreate(
          clientPayload.creditCards.map(cc => ({
            clientId: id,
            number: cc.number
          })), {
          transaction: t
        }
        );

        await client.reload({
          include: [
            CreditCard
          ],
          transaction: t
        });
      }
      if (clientPayload.gender) {
        client.gender = clientPayload.gender;
      }
      if (clientPayload.firstName) {
        client.firstName = clientPayload.firstName;
      }
      if (clientPayload.lastName) {
        client.lastName = clientPayload.lastName;
      }
      if (clientPayload.address) {
        client.address = clientPayload.address;
      }
      if (clientPayload.phoneNumber) {
        client.phoneNumber = clientPayload.phoneNumber;
      }
      if (clientPayload.email) {
        client.email = clientPayload.email;
      }
      if (clientPayload.birthDate !== undefined) {
        client.birthDate = clientPayload.birthDate;
      }

      await client.save({ transaction: t });

      const changeset = generateClientChangeset(originalClientData, client);
      await ClientChange.create({
        id: uuidv4(),
        clientId: id,
        type: 'UPDATED',
        timestamp: moment(),
        author: props.author,
        changeset: JSON.stringify(changeset)
      }, {
        transaction: t
      });

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

export const deleteClientById = async (id: string, props: DeleteClientProps): Promise<boolean> => {
  try {
    return await DB.transaction(async (t: Transaction) => {
      const client = await Client.findOne({
        where: {
          id: id,
          isDeleted: false
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

      await ClientChange.create({
        id: uuidv4(),
        clientId: id,
        type: 'DELETED',
        timestamp: moment(),
        author: props.author,
        changeset: ''
      }, {
        transaction: t
      });

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

export const findChangelogForClient = async (id: string): Promise<ClientChange[] | null> => {
  try {
    const client = await findClientById(id, { includeDeleted: true });
    if (!client) {
      return null;
    }

    return await ClientChange.findAll({
      where: {
        clientId: client.id
      },
      order: [
        ['timestamp', 'DESC']
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
