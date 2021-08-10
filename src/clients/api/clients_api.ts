import { Router, Request, Response, NextFunction } from 'express';
import { Moment } from 'moment';

import {
    findClientsPaged,
    FindClientsSortFields,
    findClientById
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

        res.status(200);
        res.json({
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
            res.status(200);
            res.json(null);
            return;
        }

        res.status(200);
        res.json({
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

clientsAPI.post('', async (req: Request, res: Response, next: NextFunction) => {
    // TODO
});

clientsAPI.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
    // TODO
});

clientsAPI.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    // TODO
});

export default clientsAPI;
