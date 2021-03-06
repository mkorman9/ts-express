import { NextFunction, Request, Response, Router } from 'express';
import { body, query } from 'express-validator';
import ws from 'ws';
import { z } from 'zod';

import { 
  getRequestBody,
  getRequestQuery,
  requestBodyMiddleware,
  requestQueryMiddleware,
  validationMiddleware
} from '../../common/middlewares/validation';
import log from '../../common/providers/logging';
import { parseDate } from '../../common/providers/validation';
import { getSession, requireRoles, tokenAuthMiddleware } from '../../security/middlewares/authorization';
import accountsProvider from '../../security/providers/accounts';
import { addSubscriber, removeSubscriber } from '../listeners/subscribers_store';
import Client from '../models/client';
import clientsProvider, { FindClientsSortFields } from '../providers/clients';
import { ClientChangeItem } from '../providers/clients_changes';

const GetClientsPagedValidators = [
  query('page')
    .optional()
    .isInt({ min: 0 }).withMessage('format'),
  query('pageSize')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('format'),
  query('sortBy')
    .optional()
    .isString().withMessage('format')
    .isIn(Object.values(FindClientsSortFields)).withMessage('oneof'),
  query('sortReverse')
    .optional(),
  query('filter')
    .optional()
    .isObject().withMessage('format'),
  query('filter.gender')
    .optional()
    .isString().withMessage('format')
    .isIn(['-', 'M', 'F']).withMessage('oneof'),
  query('filter.firstName')
    .optional()
    .isString().withMessage('format'),
  query('filter.lastName')
    .optional()
    .isString().withMessage('format'),
  query('filter.address')
    .optional()
    .isString().withMessage('format'),
  query('filter.phoneNumber')
    .optional()
    .isString().withMessage('format'),
  query('filter.email')
    .optional()
    .isString().withMessage('format'),
  query('filter.bornAfter')
    .optional()
    .isISO8601().withMessage('format'),
  query('filter.bornBefore')
    .optional()
    .isISO8601().withMessage('format'),
  query('filter.creditCard')
    .optional()
    .isString().withMessage('format')
];

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
      const creditCards = (req.body.creditCards || []).map(cc => cc.number);
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
      const creditCards = (req.body.creditCards || []).map(cc => cc.number);
      return creditCards.length === new Set(creditCards).size;
    })
    .withMessage('unique')
];

const GetClientsPagedQuerySchema = z.object({
  page: z.preprocess(arg => parseInt(arg as string), z.number()).default(0),
  pageSize: z.preprocess(arg => parseInt(arg as string), z.number()).default(10),
  sortBy: z.nativeEnum(FindClientsSortFields).default(FindClientsSortFields.id),
  sortReverse: z.preprocess(arg => !!arg, z.boolean()),
  filter: z.object({
    gender: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    email: z.string().optional(),
    bornAfter: z.preprocess(parseDate, z.date()).optional(),
    bornBefore: z.preprocess(parseDate, z.date()).optional(),
    creditCard: z.string().optional()
  }).default({})
});

type GetClientsPagedQuery = z.infer<typeof GetClientsPagedQuerySchema>;

const ClientAddRequestSchema = z.object({
  gender: z.string().optional(),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  birthDate: z.preprocess(parseDate, z.date()).optional(),
  creditCards: z.array(z.object({
    number: z.string(),
  })).default([])
});

type ClientAddRequest = z.infer<typeof ClientAddRequestSchema>;

const ClientUpdateRequestSchema = z.object({
  gender: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  address: z.string().optional(),
  phoneNumber: z.string().optional(),
  email: z.string().optional(),
  birthDate: z.preprocess(parseDate, z.date()).nullish(),
  creditCards: z.array(z.object({
    number: z.string(),
  })).optional()
});

type ClientUpdateRequest = z.infer<typeof ClientUpdateRequestSchema>;

const clientsAPI = Router();

clientsAPI.get(
  '',
  ...GetClientsPagedValidators,
  validationMiddleware(),
  requestQueryMiddleware(GetClientsPagedQuerySchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = getRequestQuery<GetClientsPagedQuery>(req);
      
      const clientsPage = await clientsProvider.findClientsPaged(query);

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
          })),
          totalPages: clientsPage.totalPages
        });
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const client = await clientsProvider.findClientById(req.params.id);
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
        });
    } catch (err) {
      next(err);
    }
  }
);

clientsAPI.post(
  '',
  tokenAuthMiddleware(),
  requireRoles(['CLIENTS_EDITOR']),
  ...ClientAddRequestValidators,
  validationMiddleware(),
  requestBodyMiddleware(ClientAddRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = getRequestBody<ClientAddRequest>(req);

    const account = getSession(req).account;
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
      const client = await clientsProvider.addClient(payload, { author: account.id });

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
  ClientUpdateRequestValidators,
  validationMiddleware(),
  requestBodyMiddleware(ClientUpdateRequestSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const payload = getRequestBody<ClientUpdateRequest>(req);

    const account = getSession(req).account;
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
      const result = await clientsProvider.updateClient(req.params.id, payload, { author: account.id });
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
  async (req: Request, res: Response, next: NextFunction) => {
    const account = getSession(req).account;
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
      const result = await clientsProvider.deleteClientById(req.params.id, { author: account.id });
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
      const changelog = await clientsProvider.findChangelogForClient(req.params.id);
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
        const author = await accountsProvider.findAccountById(id);
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

clientsAPI.ws(
  '/events/ws',
  async (ws: ws) => {
    log.info('client connected to websocket');
    const subscriptionId = addSubscriber(ws);

    ws.on('close', () => {
      log.info('client disconnected from websocket');
      removeSubscriber(subscriptionId);
    });
  }
);

export default clientsAPI;
