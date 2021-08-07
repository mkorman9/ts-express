import { Router } from 'express';

const router = Router();

router.get('/', async (req: any, res: any) => {
    res.status(200);
    res.type('text');
    res.send('Hello world!');
});

export default router;
