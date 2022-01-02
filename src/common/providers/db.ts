import path from 'path/posix';
import { Sequelize } from 'sequelize-typescript';

import config, { ConfigurationError } from './config';
import { log } from './logging';

const modelsDirs = [
  './clients/models',
  './accounts/models'
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

const DB = !config.testing ? initSequelize() : ({} as Sequelize);

export const testDBConnection = (): Promise<void> => {
  return DB
    .authenticate();
};

export default DB;
