import express from 'express';

import clientsAPI from './api/clients';

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.disable('etag');

app.use('/api/v1/client', clientsAPI);

export default app;
