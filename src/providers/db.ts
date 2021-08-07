import { Sequelize } from 'sequelize-typescript';

import { DatabaseURI } from './config';

const DB = new Sequelize(DatabaseURI, {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    models: [__dirname + '/../models']
});

export default DB;
