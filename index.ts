import { defaultLogger, ILogger } from './logger';

// ServicesToClose is an interface that defines the shape of the services that will be closed
export interface ServicesToClose { close(): Promise<void>; }

// ShutdownManager is a class that will listen for OS signals and close the services that are passed to it
// when the OS signals are received (SIGINT, SIGTERM)
export class ShutdownManager {
  private closed: boolean = false;
  private closingPromise: Promise<void> | null = null;
  private logger: ILogger;
  private readonly servicesToClose: ServicesToClose[];

  constructor();
  constructor(logger: ILogger | null);
  constructor(...servicesToClose: ServicesToClose[]);
  constructor(logger: ILogger | null, ...servicesToClose: ServicesToClose[]);
  constructor(...args: any[]) {
    const [firstArg, ...restArgs] = args;

    if (this.isLogger(firstArg)) {
      this.logger = firstArg;
      this.servicesToClose = restArgs as ServicesToClose[];
    } else if (firstArg === null) {
      this.logger = noOpLogger;
      this.servicesToClose = restArgs as ServicesToClose[];
    } else {
      this.logger = defaultLogger;
      this.servicesToClose = args.length > 0 ? [firstArg, ...restArgs] as ServicesToClose[] : [];
    }

    if (this.servicesToClose.length === 0) {
      this.logger.warn('ShutdownManager instantiated without any services to close.');
    }

    this.logger.debug('Waiting for OS signals...');
    this.init();
  }

  private isLogger(arg: unknown): arg is ILogger {
    return (
        typeof arg === 'object' &&
        arg !== null &&
        'info' in arg &&
        'debug' in arg &&
        'error' in arg
    );
  }

  private init(): void {
    process.on('SIGINT', () => this.close());
    process.on('SIGTERM', () => this.close());
  }

  private async close(): Promise<void> {
    if (!this.closed) {
      this.closed = true;
      this.logger.info('Graceful shutdown initiated.');
      if (!this.closingPromise) {
        this.closingPromise = this.closeServices();
      }
      await this.closingPromise;
    }
  }

  private async closeServices(): Promise<void> {
    for (const service of this.servicesToClose) {
      try {
        await service.close();
      } catch (error: unknown) {
        this.logger.error(`Error closing service:`, error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
}

export const noOpLogger: ILogger = {
  info: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {},
};
