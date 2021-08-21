import { Tedis } from 'tedis';

import {
  InTestingMode,
  RedisHost,
  RedisPort,
  RedisPassword,
  RedisTLS
} from './config';
import { ConfigurationError } from './common';

const initTedis = () => {
  if (!RedisHost) {
    throw new ConfigurationError('Redis host needs to be specified');
  }

  return new Tedis({
    host: RedisHost,
    port: RedisPort,
    password: RedisPassword,
    tls: RedisTLS ? ({ key: undefined, cert: undefined }) : undefined
  });
};

const redisClient = !InTestingMode ? initTedis() : ({} as Tedis);

export const testRedisConnection = (): Promise<void> => {
  return redisClient.command('PING')
    .then(() => {});
};

export default redisClient;
