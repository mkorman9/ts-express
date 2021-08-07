import { Router } from 'express';

import { Clients, ClientAttributes } from '../models/client';

interface ClientsGetResponse {
    data: ClientAttributes[],
    totalPages: number
}

const router = Router();

router.get('', async (req: any, res: any, next: any) => {
    let pageNumber = parseInt(req.query.page);
    if (Number.isNaN(pageNumber) || pageNumber < 0) {
        pageNumber = 0;
    }

    let pageSize = parseInt(req.query.pageSize);
    if (Number.isNaN(pageSize) || pageSize <= 0 || pageSize > 100) {
        pageSize = 10;
    }

    let clientsPage = null;

    try {
        clientsPage = await Clients.findAndCountAll({
            limit: pageSize,
            offset: pageSize * pageNumber,
            order: [
                ['birthDate', 'DESC']
            ]
        });
    } catch (err) {
        next(err);
        return;
    }

    res.status(200);
    res.json({
        data: clientsPage.rows,
        totalPages: Math.ceil(clientsPage.count / pageSize)
    } as ClientsGetResponse);
});

router.get('/:id', async (req: any, res: any, next: any) => {
    let client: ClientAttributes = null;
    
    try {
        client = await Clients.findOne({
            where: {
                id: req.params['id']
            }
        });
    } catch (err) {
        if (err.name === 'SequelizeDatabaseError' && 
            err.original && 
            err.original.code === '22P02') {
        } else {
            next(err);
            return;
        }
    }

    if (!client) {
        res.status(404);
        res.type('text');
        res.send('');
        return;
    }

    res.status(200);
    res.json(client);
});

export default router;
