import winston, { format } from 'winston';

export type param = { [key: string]: unknown };

export interface ILogger {
    info(message: string, ...params: param[]): void;
    debug(message: string, ...params: param[]): void;
    error(message: string, error: Error, ...params: param[]): void;
}

function errorToObject(error: Error) {
    return {
        message: error.message,
        name: error.name,
        stack: error.stack,
    };
}

const openTelemetryFormat = format.printf(
    ({ level, message, timestamp, error, ...params }) => {
        const baseAttributes = {
            level,
            timestamp,
        };

        const errorAttributes = error ? { error: JSON.stringify(error) } : {};
        const paramAttributes = params ? { ...params } : {};

        const attributes = {
            ...baseAttributes,
            ...errorAttributes,
            ...paramAttributes,
        };

        return JSON.stringify({
            message: `${message}${error ? ` - Error: ${JSON.stringify(error)}` : ''}`,
            ...attributes,
        });
    }
);

export class logger implements ILogger {
    public logger: winston.Logger;

    constructor() {
        // create logger
        this.logger = winston.createLogger({
            level: 'debug',
            format: openTelemetryFormat,
            transports: [
                new winston.transports.Console(),
            ],
            handleExceptions: true,
            exitOnError: false,
        });
    }

    private mergeParams(params: param[]) {
        return Object.assign({}, ...params);
    }

    public info(message: string, ...params: param[]): void {
        this.logger.info(message, this.mergeParams(params));
    }

    public debug(message: string, ...params: param[]): void {
        this.logger.debug(message, this.mergeParams(params));
    }

    public error(message: string, error: Error, ...params: param[]): void {
        this.mergeParams(params);
        this.logger.error(message, {
            error: errorToObject(error),
            ...this.mergeParams(params),
        });
    }
}

const loggerInstance: logger = new logger();
export { loggerInstance as defaultLogger };