import { createClient, RedisClientType } from 'redis';
import NRP from 'node-redis-pubsub';

import config, { ConfigurationError } from './config';

const initRedis = () => {
  const props = {
    url: config.redis?.url,
    password: config.redis?.password,
    tls: config.redis?.tls || false
  };

  if (!props.url) {
    throw new ConfigurationError('Redis host needs to be specified');
  }

  return createClient({
    url: props.url,
    password: props.password,
    socket: {
      tls: props.tls
    }
  });
};

const redisClient = !config.inTestMode ? initRedis() : ({} as RedisClientType);

export const redisPubsub = new NRP({
  emitter: redisClient,
  receiver: redisClient
});

export const testRedisConnection = (): Promise<void> => {
  return redisClient.connect();
};

export default redisClient;
