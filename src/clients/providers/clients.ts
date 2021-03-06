import { Op, WhereAttributeHash } from 'sequelize';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from 'sequelize';

import DB, { isInvalidUUIDError } from '../../common/providers/db';
import Client from '../models/client';
import CreditCard from '../models/credit_card';
import ClientChange from '../models/client_change';
import { generateClientChangeset } from './clients_changes';
import { definePublisher } from '../../common/providers/amqp';

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
  bornAfter?: Date;
  bornBefore?: Date;
  creditCard?: string;
}

export interface FindClientsPagedOptions {
  page?: number;
  pageSize?: number;

  sortBy?: FindClientsSortFields;
  sortReverse?: boolean;

  filter?: FindClientsFilters;
}

export interface FindClientsPagedResult {
  rows: Client[];
  totalPages: number;
}

export interface FindClientByIdOptions {
  includeDeleted?: boolean;
}

export interface CreditCardAddPayload {
  number: string;
}

export interface ClientAddPayload {
  gender?: string;
  firstName: string;
  lastName: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: Date;
  creditCards: CreditCardAddPayload[];
}

export interface CreditCardUpdatePayload {
  number: string;
}

export interface ClientUpdatePayload {
  gender?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: Date | null;
  creditCards?: CreditCardUpdatePayload[];
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

export class ClientsProvider {
  private eventsPublisherHandler = definePublisher({
    exchanges: [{
      name: 'clients_events',
      type: 'fanout',
      options: {
        durable: false
      }
    }]
  });

  async findClientsPaged(opts?: FindClientsPagedOptions): Promise<FindClientsPagedResult> {
    const options = {
      page: opts?.page || 0,
      pageSize: opts?.pageSize || 10,

      sortBy: opts?.sortBy || FindClientsSortFields.id,
      sortReverse: opts?.sortReverse || false,

      filters: opts?.filter || {}
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
          [Op.gte]: options.filters.bornAfter
        }
      });
    }
    if (options.filters.bornBefore) {
      filters.push({
        birthDate: {
          [Op.lte]: options.filters.bornBefore
        }
      });
    }
    if (options.filters.creditCard) {
      const clientWithCreditCard = await CreditCard.findAll({
        where: {
          number: {
            [Op.like]: `%${options.filters.creditCard}%`
          }
        }
      });

      filters.push({
        id: {
          [Op.in]: clientWithCreditCard.map(cc => cc.clientId)
        }
      });
    }

    const count = await Client.count({
      where: {
        [Op.and]: [{
          isDeleted: false
        }, {
          [Op.and]: [...filters]
        }]
      }
    });

    const rows = await Client.findAll({
      limit: options.pageSize,
      offset: options.pageSize * options.page,
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

    return {
      rows,
      totalPages: Math.ceil(count / options.pageSize)
    };
  }

  async findClientById(id: string, findOptions?: FindClientByIdOptions): Promise<Client | null> {
    const options = {
      includeDeleted: (findOptions?.includeDeleted === true)
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
      if (isInvalidUUIDError(err)) {
        return null;
      } else {
        throw err;
      }
    }
  }

  async addClient(clientPayload: ClientAddPayload, props: AddClientProps): Promise<Client> {
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
        timestamp: dayjs(),
        author: props.author,
        changeset: JSON.stringify(changeset)
      }, {
        transaction: t
      });

      await this.eventsPublisherHandler.withPublisher(async publisher => { 
        publisher.publish('clients_events', '', {
          event: 'added',
          id: client.id,
          author: props.author
        });
      });

      return client;
    });
  }

  async updateClient(id: string, clientPayload: ClientUpdatePayload, props: UpdateClientProps): Promise<boolean> {
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
          birthDate: client.birthDate ? client.birthDate : null,
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
          timestamp: dayjs(),
          author: props.author,
          changeset: JSON.stringify(changeset)
        }, {
          transaction: t
        });

        await this.eventsPublisherHandler.withPublisher(async publisher => {
          publisher.publish('clients_events', '', {
            event: 'modified',
            id: client.id,
            author: props.author
          });
        });

        return true;
      });
    } catch (err) {
      if (isInvalidUUIDError(err)) {
        return false;
      } else {
        throw err;
      }
    }
  }

  async deleteClientById(id: string, props: DeleteClientProps): Promise<boolean> {
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
          timestamp: dayjs(),
          author: props.author,
          changeset: ''
        }, {
          transaction: t
        });

        await this.eventsPublisherHandler.withPublisher(async publisher => {
          publisher.publish('clients_events', '', {
            event: 'deleted',
            id: client.id,
            author: props.author
          });
        });

        return true;
      });
    } catch (err) {
      if (isInvalidUUIDError(err)) {
        return false;
      } else {
        throw err;
      }
    }
  }

  async findChangelogForClient(id: string): Promise<ClientChange[] | null> {
    try {
      const client = await this.findClientById(id, { includeDeleted: true });
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
      if (isInvalidUUIDError(err)) {
        return null;
      } else {
        throw err;
      }
    }
  }
}

export default new ClientsProvider();
