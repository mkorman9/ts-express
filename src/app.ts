import express, { Router } from 'express';
import cookieParser from 'cookie-parser';

import clientsAPI from './clients/api/clients_api';
import sessionAPI from './session/api/session_api';
import authAPI from './accounts/api/auth_api';
import accountAPI from './accounts/api/account_api';

import healthcheckHandler from './handlers/healthcheck_handler';
import requestParsingErrorHandler from './handlers/request_parsing_error_handler';
import internalErrorHandler from './handlers/internal_error_handler';
import notFoundHandler from './handlers/not_found_handler';
import { accessLogger } from './providers/access_logger';

const app = express();
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.disable('x-powered-by');
app.disable('etag');

app.use(accessLogger());
app.use(cookieParser());
app.use(express.json());
app.use(requestParsingErrorHandler);

app.get('/health', healthcheckHandler);

// API v1
const apiV1 = Router();
apiV1.use('/client', clientsAPI);
apiV1.use('/login/session', sessionAPI);
apiV1.use('/login/auth', authAPI);
apiV1.use('/login/account', accountAPI);
app.use('/api/v1', apiV1);

app.use(internalErrorHandler);
app.use(notFoundHandler);

export default app;
