export type Param = { [key: string]: unknown };

export interface ILogger {
    info(message: string, ...params: Param[]): void;
    debug(message: string, ...params: Param[]): void;
    warn(message: string, ...params: Param[]): void;
    error(message: string, error: Error, ...params: Param[]): void;
}

function errorToObject(error: Error) {
    return {
        message: error.message,
        name: error.name,
        stack: error.stack,
    };
}

class Logger implements ILogger {
    private log(level: string, message: string, params?: Param) {
        const baseAttributes = {
            level,
            timestamp: new Date().toISOString(),
        };

        const attributes = {
            ...baseAttributes,
            ...params,
        };

        console.log(JSON.stringify({
            message,
            ...attributes,
        }));
    }

    private mergeParams(params: Param[]) {
        return Object.assign({}, ...params);
    }

    public info(message: string, ...params: Param[]): void {
        this.log('info', message, this.mergeParams(params));
    }

    public debug(message: string, ...params: Param[]): void {
        this.log('debug', message, this.mergeParams(params));
    }

    public warn(message: string, ...params: Param[]): void {
        this.log('warn', message, this.mergeParams(params));
    }

    public error(message: string, error: Error, ...params: Param[]): void {
        this.log('error', message, {
            error: errorToObject(error),
            ...this.mergeParams(params),
        });
    }
}

const defaultLogger = new Logger();
export { defaultLogger };
