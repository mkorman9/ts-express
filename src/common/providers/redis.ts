import { createClient, RedisClientType } from 'redis';

import config, { ConfigurationError } from './config';

const createRedisClient = () => {
  const props = {
    uri: config.redis?.uri,
    password: config.redis?.password,
    tls: config.redis?.tls || false
  };

  if (!props.uri) {
    throw new ConfigurationError('Redis URI needs to be specified');
  }

  return createClient({
    url: props.uri,
    password: props.password,
    socket: {
      tls: props.tls
    }
  });
};

const redisClient = !config.inTestMode ? createRedisClient() : ({} as RedisClientType);

export const initRedis = (): Promise<void> => {
  return redisClient
    .connect();
};

export const subscribeChannel = async <M = unknown>(patterns: string | string[], listener: (data: unknown, channel: string) => void, parser: (s: string) => M = JSON.parse): Promise<() => void> => {
  if (config.inTestMode) {
    return;
  }

  const subClient = redisClient.duplicate();
  await subClient.connect();

  await subClient.pSubscribe(patterns, (data, channel) => {
    listener(parser(data), channel);
  });

  return async () => {
    await subClient.pUnsubscribe(patterns);
  };
};

export const publishMessage = async <M = unknown>(channel: string, data: M, parser: (m: M) => string = JSON.stringify) => {
  if (config.inTestMode) {
    return;
  }

  await redisClient.PUBLISH(channel, parser(data));
};

export default redisClient;
