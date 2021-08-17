import path from 'path/posix';
import { Sequelize } from 'sequelize-typescript';

import {
  DatabaseURI,
  DatabaseQueryLogging,
  DatabasePoolMax,
  DatabasePoolMin,
  DatabasePoolAcquireMs,
  DatabasePoolIdleMs
} from './config';
import { log } from './logging';

const modelsDirs = [
  'clients/models'
];

const DB = new Sequelize(DatabaseURI, {
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

export const testDBConnection = (): Promise<void> => {
  return DB
    .authenticate()
    .then(() => { });
};

export default DB;
