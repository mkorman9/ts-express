import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import moment, { Moment } from 'moment';

import {
  findClientsPaged,
  FindClientsSortFields,
  FindClientsFilters,
  findClientById,
  ClientAddPayload,
  addClient,
  ClientUpdatePayload,
  updateClient,
  deleteClientById,
  findChangelogForClient
} from '../providers/clients';
import Client from '../models/client';
import { ClientChangeItem } from '../providers/clients_changes';
import {
  tokenAuthMiddleware,
  requireRoles,
  includeSessionAccount,
  getSessionAccount
} from '../../session/middlewares/authorization';
import Account from '../../accounts/models/account';
import { findAccountById } from '../../accounts/providers/accounts';

interface CreditCardView {
  number: string;
}

interface ClientView {
  id: string;
  gender: string;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber: string;
  email: string;
  birthDate: Moment | null;
  creditCards: CreditCardView[];
}

interface ClientsGetResponse {
  data: ClientView[];
  totalPages: number;
}

const ClientAddRequestValidators = [
  body('gender')
    .optional()
    .isIn(['-', 'M', 'F']).withMessage('oneof'),
  body('firstName')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 1 }).withMessage('lt')
    .isLength({ max: 255 }).withMessage('gt'),
  body('lastName')
    .exists().withMessage('required')
    .bail()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 1 }).withMessage('lt')
    .isLength({ max: 255 }).withMessage('gt'),
  body('address')
    .optional()
    .isLength({ max: 1024 }).withMessage('gt'),
  body('phoneNumber')
    .optional()
    .isLength({ max: 64 }).withMessage('gt'),
  body('email')
    .optional()
    .isLength({ max: 64 }).withMessage('gt'),
  body('birthDate')
    .optional()
    .isISO8601().withMessage('format'),
  body('creditCards')
    .optional()
    .isArray().withMessage('format'),
  body('creditCards[*].number')
    .exists().withMessage('required')
    .bail()
    .matches(/^\d{4} \d{4} \d{4} \d{4}$/).withMessage('ccnumber'),
  body('creditCards.number')
    .custom((_, { req }) => {
      const creditCards = (req.body['creditCards'] || []).map(cc => cc.number);
      return creditCards.length === new Set(creditCards).size;
    })
    .withMessage('unique')
];

const ClientUpdateRequestValidators = [
  body('gender')
    .optional()
    .isIn(['-', 'M', 'F']).withMessage('oneof'),
  body('firstName')
    .optional()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 1 }).withMessage('lt')
    .isLength({ max: 255 }).withMessage('gt'),
  body('lastName')
    .optional()
    .isString().withMessage('format')
    .bail()
    .isLength({ min: 1 }).withMessage('lt')
    .isLength({ max: 255 }).withMessage('gt'),
  body('address')
    .optional()
    .isLength({ max: 1024 }).withMessage('gt'),
  body('phoneNumber')
    .optional()
    .isLength({ max: 64 }).withMessage('gt'),
  body('email')
    .optional()
    .isLength({ max: 64 }).withMessage('gt'),
  body('birthDate')
    .optional()
    .if((value) => value !== null)
    .isISO8601().withMessage('format'),
  body('creditCards')
    .optional()
    .isArray().withMessage('format'),
  body('creditCards[*].number')
    .exists().withMessage('required')
    .bail()
    .matches(/^\d{4} \d{4} \d{4} \d{4}$/).withMessage('ccnumber'),
  body('creditCards.number')
    .custom((_, { req }) => {
      const creditCards = (req.body['creditCards'] || []).map(cc => cc.number);
      return creditCards.length === new Set(creditCards).size;
    })
    .withMessage('unique')
];

const clientsAPI = Router();

clientsAPI.get(
  '',
  async (req: Request, res: Response, next: NextFunction) => {
    let pageNumber = parseInt(req.query.page as string);
    if (Number.isNaN(pageNumber) || pageNumber < 0) {
      pageNumber = 0;
    }

    let pageSize = parseInt(req.query.pageSize as string);
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 100) {
      pageSize = 10;
    }

    let sortBy = FindClientsSortFields.id;
    if (req.query.sortBy) {
      if (Object.values(FindClientsSortFields).includes(req.query.sortBy as FindClientsSortFields)) {
        sortBy = req.query.sortBy as FindClientsSortFields;
      } else {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'sortBy',
              code: 'oneof'
            }]
          });
      }
    }

    const sortReverse = 'sortReverse' in req.query;

    let filters: FindClientsFilters = {};
    try {
      filters = parseClientsFilters(req.query);
    } catch (err) {
      if (err instanceof ClientsFiltersParsingError) {
        return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: err.field,
              code: err.code
            }]
          });
      }
    }

    try {
      const clientsPage = await findClientsPaged({
        pageNumber,
        pageSize,

        sortBy,
        sortReverse,

        filters
      });

      res
        .status(200)
        .json({
          data: clientsPage.rows.map((c: Client) => ({
            id: c.id,
            gender: c.gender,
            firstName: c.firstName,
            lastName: c.lastName,
            address: c.address,
            phoneNumber: c.phoneNumber,
            email: c.email,
            birthDate: c.birthDate,
            creditCards: c.creditCards.map(cc => ({
              number: cc.number
            }))
          }) as ClientView),
          totalPages: Math.ceil(clientsPage.count / pageSize)
        } as ClientsGetResponse);
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await findClientById(req.params['id']);
      if (!client) {
        return res
          .status(404)
          .json({
            status: 'error',
            message: 'Client not found'
          });
      }

      return res
        .status(200)
        .json({
          id: client.id,
          gender: client.gender,
          firstName: client.firstName,
          lastName: client.lastName,
          address: client.address,
          phoneNumber: client.phoneNumber,
          email: client.email,
          birthDate: client.birthDate,
          creditCards: client.creditCards.map(cc => ({
            number: cc.number
          }))
        } as ClientView);
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.post(
  '',
  tokenAuthMiddleware(),
  requireRoles(['CLIENTS_EDITOR']),
  includeSessionAccount(ctx => findAccountById(ctx.subject)),
  ...ClientAddRequestValidators,
  async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    const clientPayload: ClientAddPayload = {
      gender: req.body['gender'],
      firstName: req.body['firstName'],
      lastName: req.body['lastName'],
      address: req.body['address'],
      phoneNumber: req.body['phoneNumber'],
      email: req.body['email'],
      birthDate: req.body['birthDate'] ? moment(req.body['birthDate']) : undefined,
      creditCards: !req.body['creditCards'] ? [] : (req.body['creditCards'] as { number: string }[]).map(cc => ({
        number: cc['number']
      }))
    };

    const account = getSessionAccount<Account>(req);
    if (account.isBanned) {
      return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'account',
              code: 'banned'
            }]
          });
    }

    try {
      const client = await addClient(clientPayload, { author: account.id });
      return res
        .status(200)
        .json({
          id: client.id
        });
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.put(
  '/:id',
  tokenAuthMiddleware(),
  requireRoles(['CLIENTS_EDITOR']),
  includeSessionAccount(ctx => findAccountById(ctx.subject)),
  ClientUpdateRequestValidators,
  async (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res
        .status(400)
        .json({
          status: 'error',
          message: 'Validation error',
          causes: validationErrors.array().map(e => ({
            field: e.param,
            code: e.msg
          }))
        });
    }

    const clientPayload: ClientUpdatePayload = {
      gender: req.body['gender'],
      firstName: req.body['firstName'],
      lastName: req.body['lastName'],
      address: req.body['address'],
      phoneNumber: req.body['phoneNumber'],
      email: req.body['email'],
      birthDate: req.body['birthDate'] ? moment(req.body['birthDate']) : req.body['birthDate'],
      creditCards: !req.body['creditCards'] ? undefined : (req.body['creditCards'] as { number: string }[]).map(cc => ({
        number: cc['number']
      }))
    };

    const account = getSessionAccount<Account>(req);
    if (account.isBanned) {
      return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'account',
              code: 'banned'
            }]
          });
    }

    try {
      const result = await updateClient(req.params['id'], clientPayload, { author: account.id });
      if (!result) {
        return res
          .status(404)
          .json({
            status: 'error',
            message: 'Client not found'
          });
      }

      return res
        .status(200)
        .json({
          status: 'success'
        });
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.delete(
  '/:id',
  tokenAuthMiddleware(),
  requireRoles(['CLIENTS_EDITOR']),
  includeSessionAccount(ctx => findAccountById(ctx.subject)),
  async (req: Request, res: Response, next: NextFunction) => {
    const account = getSessionAccount<Account>(req);
    if (account.isBanned) {
      return res
          .status(400)
          .json({
            status: 'error',
            message: 'Validation error',
            causes: [{
              field: 'account',
              code: 'banned'
            }]
          });
    }

    try {
      const result = await deleteClientById(req.params['id'], { author: account.id });
      if (!result) {
        return res
          .status(404)
          .json({
            status: 'error',
            message: 'Client not found'
          });
      }

      return res
        .status(200)
        .json({
          status: 'success'
        });
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.get(
  '/:id/changelog',
  tokenAuthMiddleware(),
  requireRoles(['CLIENTS_EDITOR']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const changelog = await findChangelogForClient(req.params['id']);
      if (changelog === null) {
        return res
          .status(404)
          .json({
            status: 'error',
            message: 'Client not found'
          });
      }

      const authorsIds = new Set(changelog.map(c => c.author));
      const authorsUsernames = new Map<string, string>();
      for (const id of authorsIds) {
        const author = await findAccountById(id);
        if (author) {
          authorsUsernames[id] = author.username;
        }
      }

      return res
        .status(200)
        .json(changelog.map(change => ({
          type: change.type,
          timestamp: change.timestamp,
          authorId: change.author,
          authorUsername: authorsUsernames[change.author] || null,
          changeset: JSON.parse(change.changeset || '[]') as ClientChangeItem[]
        })));
    } catch (err) {
      next(err);
    }
  }
);

class ClientsFiltersParsingError extends Error {
  public code: string;
  public field: string;

  constructor(code: string, field: string) {
    super('ClientsFiltersParsingError');
    this.code = code;
    this.field = field;
  }
}

const parseClientsFilters = (query: unknown): FindClientsFilters => {
  const queryFilters = query['filter'];
  if (!queryFilters) {
    return {};
  }

  const ret: FindClientsFilters = {};

  Object.keys(queryFilters).forEach(k => {
    let value = queryFilters[k];
    if (Array.isArray(value)) {
      value = value[value.length - 1];
    }

    if (k === 'gender') {
      if (!['-', 'M', 'F'].includes(value)) {
        throw new ClientsFiltersParsingError('oneof', 'filter[gender]');
      }

      ret.gender = value;
    } else if (k === 'firstName') {
      ret.firstName = value;
    } else if (k === 'lastName') {
      ret.lastName = value;
    } else if (k === 'address') {
      ret.address = value;
    } else if (k === 'phoneNumber') {
      ret.phoneNumber = value;
    } else if (k === 'email') {
      ret.email = value;
    } else if (k === 'bornAfter') {
      let dt: Moment = null;
      try {
        dt = moment(value, true);
      } catch (err) {
        // ignore
      }

      if (!dt || !dt.isValid()) {
        throw new ClientsFiltersParsingError('dateformat', 'filter[bornAfter]');
      }

      ret.bornAfter = dt;
    } else if (k === 'bornBefore') {
      let dt: Moment = null;
      try {
        dt = moment(value, true);
      } catch (err) {
        // ignore
      }

      if (!dt || !dt.isValid()) {
        throw new ClientsFiltersParsingError('dateformat', 'filter[bornBefore]');
      }

      ret.bornBefore = dt;
    } else if (k === 'creditCard') {
      ret.creditCardNumber = value;
    } else {
      throw new ClientsFiltersParsingError('oneof', 'filter');
    }
  });

  if (ret.bornAfter && ret.bornBefore) {
    if (ret.bornAfter.isAfter(ret.bornBefore)) {
      throw new ClientsFiltersParsingError('invalidinterval', 'filter[bornAfter]');
    }
  }

  return ret;
};

export default clientsAPI;
