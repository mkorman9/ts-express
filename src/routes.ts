import { Router } from 'express';

import { log } from './logging';

const router = Router();

router.get('/', async (req: any, res: any) => {
    log.error('new request');

    res.status(200);
    res.type('text');
    res.send('Hello world!');
});

export default router;
