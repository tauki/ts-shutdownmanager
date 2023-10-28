import { ILogger } from './logger';
export interface ServicesToClose {
    close(): Promise<void>;
}
export declare class ShutdownManager {
    private closed;
    private closingPromise;
    private logger;
    private readonly servicesToClose;
    constructor(logger?: ILogger, ...servicesToClose: ServicesToClose[]);
    constructor(...servicesToClose: ServicesToClose[]);
    private init;
    private close;
    private closeServices;
}
