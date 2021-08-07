import winston from 'winston';

export const log = (() => {
    return winston.createLogger({
        level: 'info',
        transports: [
            new winston.transports.Console()
        ],
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf(l => `${l.timestamp} | ${l.message}`)
        )
    });
})();
