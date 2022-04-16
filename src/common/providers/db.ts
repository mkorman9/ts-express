import path from 'path/posix';
import { QueryTypes } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';

import config, { ConfigurationError } from './config';
import log from './logging';

const modelsDirs = [
  './clients/models',
  './security/models',
  './captcha/models'
];

const initSequelize = () => {
  const props = {
    uri: config.database?.uri,
    queryLogging: config.database?.queryLogging || false,
    pool: {
      max: config.database?.pool?.max || 5,
      min: config.database?.pool?.min || 0,
      acquireMs: config.database?.pool?.acquireMs || 30000,
      idleMs: config.database?.pool?.idleMs || 10000
    }
  };

  if (!props.uri) {
    throw new ConfigurationError('Database URI needs to be specified');
  }

  return new Sequelize(props.uri, {
    dialect: 'postgres',
    logging: props.queryLogging ? ((s: string) => log.debug(s)) : false,
    pool: {
      max: props.pool.max,
      min: props.pool.min,
      acquire: props.pool.acquireMs,
      idle: props.pool.idleMs
    },
    models: modelsDirs.map(dir => path.resolve(__dirname, '../..', dir))
  });
};

const DB = !config.inTestMode ? initSequelize() : ({} as Sequelize);

export const initDB = async (): Promise<void> => {
  return await DB.authenticate();
};

export const closeDB = async (): Promise<void> => {
  return await DB.close();
};

export const advisoryLock = async (lock: number, callback: () => Promise<void>) => {
  const acquire = async (): Promise<boolean> => {
    const result = await DB.query('SELECT pg_try_advisory_lock(?)', {
      replacements: [lock],
      type: QueryTypes.SELECT
    });

    return result[0]['pg_try_advisory_lock'];
  };

  const release = async () => {
    await DB.query('SELECT pg_advisory_unlock(?)', {
      replacements: [lock]
    });
  };

  let ok = false;

  try {
    ok = await acquire();

    if (ok) {
      await callback();
    } else {
      log.warn(`advisory lock ${lock} not acquired`);
    }
  } catch (err) {
    log.error(`error while acquiring advisory lock ${lock}: ${err}`);
  } finally {
    if (ok) {
      try {
        await release();
      } catch (err) {
        log.error(`error while releasing advisory lock ${lock}: ${err}`);
      }
    }
  }
};

export default DB;
