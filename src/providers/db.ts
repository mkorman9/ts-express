import { Sequelize } from 'sequelize';

const DB = new Sequelize('postgres://username:password@localhost:5432/gogin?sslmode=disable', {
    dialect: 'postgres',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

export default DB;
