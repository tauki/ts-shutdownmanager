import { defaultLogger, ILogger } from './logger';

export const noOpLogger: ILogger = {
  info: () => {},
  debug: () => {},
  error: () => {},
  warn: () => {},
};

// ServicesToClose is an interface that defines the shape of the services that will be closed
export interface ServicesToClose { close(): Promise<void>; }

// ShutdownConfig is an interface that defines the configuration options for the ShutdownManager
export interface ShutdownConfig {
  logger?: ILogger | null;
  parallel?: boolean;
}

// ShutdownManager is a class that will listen for OS signals and close the services that are passed to it
// when the OS signals are received (SIGINT, SIGTERM)
export class ShutdownManager {
  private closed: boolean = false;
  private closingPromise: Promise<void> | null = null;
  private logger: ILogger;
  private servicesToClose: ServicesToClose[];
  private readonly shutdownInitiatedPromise: Promise<void>;
  private resolveShutdownInitiated!: () => void;
  private parallel: boolean = false;

  constructor();
  constructor(logger: ILogger | null);
  constructor(config: ShutdownConfig);
  constructor(...servicesToClose: ServicesToClose[]);
  constructor(logger: ILogger | null, ...servicesToClose: ServicesToClose[]);
  constructor(config: ShutdownConfig, ...servicesToClose: ServicesToClose[]);
  constructor(...args: any[]) {
    this.shutdownInitiatedPromise = new Promise((resolve) => {
      this.resolveShutdownInitiated = resolve;
    });

    const [firstArg, ...restArgs] = args;

    if (this.isConfig(firstArg)) {
      this.logger = firstArg.logger === null ? noOpLogger : (firstArg.logger || defaultLogger);
      this.parallel = !!firstArg.parallel;
      this.servicesToClose = restArgs as ServicesToClose[];
    } else if (this.isLogger(firstArg)) {
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

  public addService(service: ServicesToClose): void {
    this.servicesToClose.push(service);
  }

  public async wait(): Promise<void> {
    await this.shutdownInitiatedPromise;
    if (this.closingPromise) {
      await this.closingPromise;
    }
  }

  public async shutdown(timeout?: number, source: 'programmatic' | 'signal' = 'programmatic'): Promise<void> {
    this.logger.info(`Shutdown initiated ${source === 'programmatic' ? 'programmatically' : 'by signal'}.`);
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
        'error' in arg &&
        'warn' in arg
    );
  }

  private isConfig(arg: unknown): arg is ShutdownConfig {
    if (typeof arg !== 'object' || arg === null || this.isLogger(arg)) {
      return false;
    }
    // If it's an object and not a logger, check if it's a service.
    // A service MUST have a 'close' method.
    // If it has a 'close' method, we treat it as a service, not a config.
    return !('close' in arg);
  }

  private init(): void {
    process.on('SIGINT', this.handleSignal);
    process.on('SIGTERM', this.handleSignal);
  }

  private handleSignal = (): void => {
    this.shutdown(undefined, 'signal').catch((error) => this.logger.error('Failed to shutdown:', error));
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
    this.resolveShutdownInitiated();
    this.logger.info('Graceful shutdown initiated.');
    this.closingPromise = this.closeServices().finally(() => {
      this.cleanupSignals();
    });

    return this.closingPromise;
  }

  private async closeService(service: ServicesToClose): Promise<void> {
    try {
      await service.close();
    } catch (error: unknown) {
      const errorObject = error instanceof Error ? error : new Error(String(error));
      this.logger.error(`Error closing service: ${errorObject.message}`, errorObject);
    }
  }

  private async closeServices(): Promise<void> {
    if (this.parallel) {
      await Promise.all(this.servicesToClose.map((service) => this.closeService(service)));
    } else {
      for (const service of this.servicesToClose) {
        await this.closeService(service);
      }
    }
  }
}
