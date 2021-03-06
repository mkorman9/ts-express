import './dayjs_config';
import express, { Router } from 'express';
import expressWs from 'express-ws';

const appWs = expressWs(express());

import cookieParser from 'cookie-parser';
import prometheusMiddleware from 'express-prometheus-middleware';

import clientsAPI from './clients/api/clients_api';
import sessionAPI from './security/api/session_api';
import accountAPI from './security/api/account_api';
import captchaAPI from './captcha/api/captcha_api';

import healthcheck from './common/middlewares/healthcheck';
import requestParsingErrors from './common/middlewares/request_parsing_errors';
import internalErrors from './common/middlewares/internal_errors';
import notFound from './common/middlewares/not_found';
import accessLogger from './common/middlewares/access_logger';

import './clients/listeners/clients_events_listener';

const app = appWs.app;

app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.disable('x-powered-by');
app.disable('etag');

app.use(accessLogger());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(prometheusMiddleware({
  metricsPath: '/metrics',
  collectDefaultMetrics: true,
  requestDurationBuckets: [],
  normalizeStatus: false
}));
app.use(requestParsingErrors);

app.get('/health', healthcheck);

// API v1
const apiV1 = Router();
apiV1.use('/client', clientsAPI);
apiV1.use('/session', sessionAPI);
apiV1.use('/account', accountAPI);
apiV1.use('/captcha', captchaAPI);
app.use('/api/v1', apiV1);

app.use(internalErrors);
app.use(notFound);

export default app;
