import express from 'express';

import routes from './routes';

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.disable('etag');

app.use(routes);

export default app;
