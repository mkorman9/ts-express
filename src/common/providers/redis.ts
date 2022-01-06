import { createClient, RedisClientType } from 'redis';

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

export const testRedisConnection = (): Promise<void> => {
  return redisClient.connect();
};

export const subscribeChannel = async <M = unknown>(patterns: string | string[], listener: (data: unknown, channel: string) => void, parser: (s: string) => M = JSON.parse) => {
  const subClient = redisClient.duplicate();
  await subClient.connect();

  await subClient.pSubscribe(patterns, (data, channel) => {
    listener(parser(data), channel);
  });
};

export const publishMessage = async <M = unknown>(channel: string, data: M, parser: (m: M) => string = JSON.stringify) => {
  await redisClient.PUBLISH(channel, parser(data));
};

export default redisClient;
