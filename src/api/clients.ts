import { Router } from 'express';
import { Op } from 'sequelize';

import Client from '../models/client';
import CreditCard from '../models/credit_card';

interface ClientsGetResponse {
    data: Client[],
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
        clientsPage = await Client.findAndCountAll({
            limit: pageSize,
            offset: pageSize * pageNumber,
            where: {
                isDeleted: {
                    [Op.ne]: true
                }
            },
            order: [
                ['birthDate', 'DESC']
            ],
            include: [
                CreditCard
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
    let client: Client = null;
    
    try {
        client = await Client.findOne({
            where: {
                id: req.params['id'],
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
        } else {
            next(err);
            return;
        }
    }

    res.status(200);
    res.json(client);
});

export default router;
