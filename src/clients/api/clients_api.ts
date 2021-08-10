import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import moment, { Moment } from 'moment';

import {
    findClientsPaged,
    FindClientsSortFields,
    findClientById,
    ClientAddPayload,
    addClient,
    deleteClientById
} from '../providers/clients_provider';
import Client from '../models/client';

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

interface ClientAddRequest {
    gender?: string;
    firstName?: string;
    lastName?: string;
    address?: string;
    phoneNumber?: string;
    email?: string;
    birthDate?: Moment;
    creditCards?: CreditCardView[];
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
        .matches(/^\d{4} \d{4} \d{4} \d{4}$/).withMessage('ccnumber')
];

const clientsAPI = Router();

clientsAPI.get('', async (req: Request, res: Response, next: NextFunction) => {
    let pageNumber = parseInt(req.query.page as string);
    if (Number.isNaN(pageNumber) || pageNumber < 0) {
        pageNumber = 0;
    }

    let pageSize = parseInt(req.query.pageSize as string);
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 100) {
        pageSize = 10;
    }

    let sortBy = FindClientsSortFields.id;
    if (req.query.sortBy && (req.query.sortBy as string) in FindClientsSortFields) {
        sortBy = req.query.sortBy as FindClientsSortFields;
    }

    let sortReverse = 'sortReverse' in req.query;

    try {
        const clientsPage = await findClientsPaged({
            pageNumber,
            pageSize,

            sortBy,
            sortReverse
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
});

clientsAPI.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const client = await findClientById(req.params['id']);
        if (!client) {
            return res
                .status(404)
                .json({
                    status: "error"
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
});

clientsAPI.post(
    '',
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

        try {
            const client = await addClient(clientPayload);
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

clientsAPI.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    // TODO
});

clientsAPI.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await deleteClientById(req.params['id']);
        if (!result) {
            return res
                .status(404)
                .json({
                    status: "error",
                    message: "Client not found"
                });
        }

        return res
            .status(200)
            .json({
                status: "success"
            });
    } catch (err) {
        next(err);
    }
});

export default clientsAPI;
