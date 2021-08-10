import express, { Router } from 'express';

import clientsAPI from './clients/api/clients_api';

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.disable('etag');

// API v1
const apiV1 = Router();

apiV1.use('/client', clientsAPI);

app.use('/api/v1', apiV1);

export default app;
