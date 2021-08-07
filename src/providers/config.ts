import dotenv from 'dotenv';

dotenv.config();

export const ServerPort = parseInt(process.env.SERVER_PORT) || 5000;
export const ServerHost = process.env.SERVER_HOST || '0.0.0.0';
