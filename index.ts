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

  public async wait(): Promise<void> {
    if (!this.closed) {
      await new Promise<void>((resolve): void => {
        const check = (): void => {
          if (this.closed) resolve();
          else setTimeout(check, 100);
        };
        check();
      });
    }
  }

  public async shutdown(timeout?: number): Promise<void> {
    this.logger.info('Shutdown initiated programmatically.');
    const shutdownPromise: Promise<void> = this.close();

    if (timeout !== undefined) {
      const timeoutPromise: Promise<void> = new Promise<void>((_, reject): void => {
        setTimeout(() => {
          reject(new Error(`Shutdown timed out after ${timeout}ms`));
        }, timeout);
      });

      try {
        await Promise.race([shutdownPromise, timeoutPromise]);
      } catch (error) {
        this.logger.error('Shutdown failed:', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    } else {
      try {
        await shutdownPromise;
      } catch (error) {
        this.logger.error('Shutdown failed:', error instanceof Error ? error : new Error(String(error)));
        throw error;
      }
    }
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
    process.on('SIGINT', this.handleSignal);
    process.on('SIGTERM', this.handleSignal);
  }

  private handleSignal = (): void => {
    this.shutdown().catch((error) => this.logger.error('Failed to shutdown:', error));
  };

  private cleanupSignals(): void {
    process.removeListener('SIGINT', this.handleSignal);
    process.removeListener('SIGTERM', this.handleSignal);
  }

  private async close(): Promise<void> {
    if (this.closed) {
      if (this.closingPromise) {
        return this.closingPromise;
      } else {
        return;
      }
    }

    this.closed = true;
    this.logger.info('Graceful shutdown initiated.');
    this.closingPromise = this.closeServices().finally(() => {
      this.cleanupSignals();
    });

    return this.closingPromise;
  }

  private async closeServices(): Promise<void> {
    for (const service of this.servicesToClose) {
      try {
        await service.close();
      } catch (error: unknown) {
        const errorObject = error instanceof Error ? error : new Error(String(error));
        this.logger.error(`Error closing service: ${errorObject.message}`, errorObject);
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
