import winston from 'winston';
export type param = {
    [key: string]: unknown;
};
export interface ILogger {
    info(message: string, ...params: param[]): void;
    debug(message: string, ...params: param[]): void;
    error(message: string, error: Error, ...params: param[]): void;
}
export declare class logger implements ILogger {
    logger: winston.Logger;
    constructor();
    private mergeParams;
    info(message: string, ...params: param[]): void;
    debug(message: string, ...params: param[]): void;
    error(message: string, error: Error, ...params: param[]): void;
}
declare const loggerInstance: logger;
export { loggerInstance as defaultLogger };
