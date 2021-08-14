import { Tedis } from 'tedis';

import {
    RedisHost,
    RedisPort,
    RedisPassword,
    RedisTLS
} from './config';

const redisClient = new Tedis({
    host: RedisHost,
    port: RedisPort,
    password: RedisPassword,
    tls: RedisTLS ? ({ key: undefined, cert: undefined }) : undefined
});

export const testRedisConnection = (): Promise<void> => {
    return redisClient.command('PING')
        .then(() => {});
};

export default redisClient;
