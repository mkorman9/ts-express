import express from 'express';
import dotenv from 'dotenv';

import routes from './routes';

dotenv.config();
const serverPort = parseInt(process.env.SERVER_PORT) || 5000;
const serverHost = process.env.SERVER_HOST || '0.0.0.0';

const app = express();
app.use(express.json());
app.disable('x-powered-by');
app.disable('etag');

app.use(routes);

app.listen(serverPort, serverHost, () => {
    console.log(`server listening on ${serverHost}:${serverPort}`);
});
