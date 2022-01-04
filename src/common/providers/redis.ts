import { Tedis } from 'tedis';

import config, { ConfigurationError } from './config';

const initTedis = () => {
  const props = {
    host: config.redis?.host,
    port: config.redis?.port || 6379,
    password: config.redis?.password,
    tls: config.redis?.tls || false
  };

  if (!props.host) {
    throw new ConfigurationError('Redis host needs to be specified');
  }

  return new Tedis({
    host: props.host,
    port: props.port,
    password: props.password,
    tls: props.tls ? ({ key: undefined, cert: undefined }) : undefined
  });
};

const redisClient = !config.inTestMode ? initTedis() : ({} as Tedis);

export const testRedisConnection = (): Promise<void> => {
  return redisClient
    .command('PING');
};

export default redisClient;
