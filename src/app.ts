import express, { Router } from 'express';

import clientsAPI from './clients/api/clients_api';
import healthcheckHandler from './handlers/healthcheck_handler';
import requestParsingErrorHandler from './handlers/request_parsing_error_handler';
import internalErrorHandler from './handlers/internal_error_handler';
import notFoundHandler from './handlers/not_found_handler';

const app = express();
app.disable('x-powered-by');
app.disable('etag');
app.use(express.json());
app.use(requestParsingErrorHandler);
app.get('/debug/health', healthcheckHandler);

// API v1
const apiV1 = Router();

apiV1.use('/client', clientsAPI);

app.use('/api/v1', apiV1);

app.use(internalErrorHandler);
app.use(notFoundHandler);

export default app;
