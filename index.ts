import {defaultLogger, ILogger} from './logger';

// ServicesToClose is an interface that defines the shape of the services that will be closed
export interface ServicesToClose { close(): Promise<void>; }

// ShutdownManager is a class that will listen for OS signals and close the services that are passed to it
// when the OS signals are received (SIGINT, SIGTERM)
export class ShutdownManager {
  private closed: boolean = false;
  private closingPromise: Promise<void> | null = null;
  private logger: ILogger;
  private readonly servicesToClose: ServicesToClose[];

  constructor(logger?: ILogger, ...servicesToClose: ServicesToClose[]);
  constructor(...servicesToClose: ServicesToClose[]);
  constructor(...args: any[]) {
    const lastArg = args[args.length - 1];
    if (typeof lastArg === 'object' && 'info' in lastArg && 'debug' in lastArg && 'error' in lastArg) {
      this.logger = lastArg;
      this.servicesToClose = args.slice(0, -1) as ServicesToClose[];
    } else {
      this.logger = defaultLogger;
      this.servicesToClose = args as ServicesToClose[];
    }
    this.logger.debug('Waiting for OS signals...');
    this.init();
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
