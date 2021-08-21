import path from 'path/posix';
import { Sequelize } from 'sequelize-typescript';

import {
  InTestingMode,
  DatabaseURI,
  DatabaseQueryLogging,
  DatabasePoolMax,
  DatabasePoolMin,
  DatabasePoolAcquireMs,
  DatabasePoolIdleMs
} from './config';
import { log } from './logging';
import { ConfigurationError } from './common';

const modelsDirs = [
  'clients/models',
  'accounts/models'
];

const initSequelize = () => {
  if (!DatabaseURI) {
    throw new ConfigurationError('Database URI needs to be specified');
  }

  return new Sequelize(DatabaseURI, {
    dialect: 'postgres',
    logging: DatabaseQueryLogging ? ((s: string) => log.debug(s)) : false,
    pool: {
      max: DatabasePoolMax,
      min: DatabasePoolMin,
      acquire: DatabasePoolAcquireMs,
      idle: DatabasePoolIdleMs
    },
    models: modelsDirs.map(dir => path.resolve(__dirname, '..', dir))
  });
};

const DB = !InTestingMode ? initSequelize() : ({} as Sequelize);

export const testDBConnection = (): Promise<void> => {
  return DB
    .authenticate()
    .then(() => {});
};

export default DB;
