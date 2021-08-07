import dotenv from 'dotenv';

dotenv.config();

export const ServerPort = parseInt(process.env.SERVER_PORT) || 5000;
export const ServerHost = process.env.SERVER_HOST || '0.0.0.0';

export const DatabaseURI = process.env.DATABASE_URI;
if (!DatabaseURI) {
    throw new Error('DATABASE_URI is missing');
}
