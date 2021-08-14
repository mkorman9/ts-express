import { Tedis } from 'tedis';

import {
    RedisHost,
    RedisPort,
    RedisPassword
} from './config';

const redisClient = new Tedis({
    host: RedisHost,
    port: RedisPort,
    password: RedisPassword
});

export const testRedisConnection = (): Promise<void> => {
    return redisClient.command('PING')
        .then(() => {});
};

export default redisClient;
