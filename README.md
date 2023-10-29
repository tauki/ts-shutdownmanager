# shutdownmanager

ShutdownManager is a lightweight TypeScript library designed to manage the graceful shutdown of services in a Node.js application. It listens for OS signals `(SIGINT, SIGTERM)` and ensures that all registered services are properly closed before the application exits. This is especially useful for releasing database connections, closing file streams, or cleaning up resources to prevent data corruption and ensure a smooth restart.

## Installation

You can install ShutdownManager using npm:

```bash
npm install @tauki/shutdownmanager@1.0.0 --registry=https://npm.pkg.github.com
```

Or, you can add it to your `package.json` file:

```json
{
  "dependencies": {
    "@tauki/shutdownmanager": "^1.0.0"
  }
}
```

And then run:

```bash
npm install
```

## Usage

### Basic Example

First, import the `ShutdownManager`:

```typescript
import { ShutdownManager } from '@tauki/shutdownmanager';
```

Or in CommonJS syntax:

```javascript
const { ShutdownManager } = require('@tauki/shutdownmanager');
```

Next, initialize the `ShutdownManager` and add your services. Each service should have a `close` method which returns a Promise. This method will contain the logic to gracefully shut down the service.

```typescript
const databaseService = {
  close: async (): Promise<void> => {
    console.log('Closing database connections...');
    // Add logic to close database connections here
  }
};

const eventBusService = {
  close: async (): Promise<void> => {
    console.log('Closing event bus connections...');
    // Add logic to close event bus connections here
  }
};

const shutdownManager = new ShutdownManager(databaseService, eventBusService);
```

### Manually Initiating Shutdown

While `shutdownmanager` is designed to handle the graceful shutdown of services in response to OS signals like `SIGINT` and `SIGTERM`, you can also manually initiate the shutdown process using the `shutdown` method.

### Waiting for Services to Close

To manually initiate the shutdown and wait for all services to close, call the `shutdown` method on the `ShutdownManager` instance. This method returns a Promise that resolves when all services have been successfully closed.

```typescript
await shutdownManager.shutdown();
```

This can be particularly useful in scenarios where you need to programmatically control when the shutdown process begins, rather than waiting for an OS signal.

### Waiting for Services to Close with a Timeout

You can also manually initiate the shutdown with a timeout, ensuring that the process does not hang indefinitely if there are issues closing the services. To do this, pass the desired timeout (in milliseconds) as an argument to the `shutdown` method. This method returns a Promise that resolves when all services have been closed, or rejects if the timeout is reached before the shutdown is complete.

```typescript
await shutdownManager.shutdown(5000);
```

It’s important to note that even if you are using the `shutdown` method to manually initiate the shutdown process, `shutdownmanager` will still respond to OS signals. If a `SIGINT` or `SIGTERM` signal is received while the shutdown is in progress, it will not interrupt the manual shutdown process. However, if the shutdown is initiated by an OS signal and then `shutdown` is called manually, the method will return the Promise of the ongoing shutdown process, ensuring that your services are not closed multiple times.

By providing these manual controls in addition to automatic handling of OS signals, `shutdownmanager` offers a flexible solution for managing the graceful shutdown of services in various scenarios.

### Wait for Manager to Close

If you want to wait for the shutdown manager to finish its shutdown process, you can use the `wait` method:

```typescript
const shutdownManager = new ShutdownManager(/*...services...*/);
//...
await shutdownManager.wait();
```

### Using a Custom Logger

To use a custom logger, pass it as the first argument to the `ShutdownManager` constructor. Ensure that your logger has `info`, `debug`, `error`, and `warn` methods.

```typescript
const customLogger = {
  info: (message: string) => console.log(`INFO: ${message}`),
  debug: (message: string) => console.log(`DEBUG: ${message}`),
  error: (message: string, error?: Error) => console.error(`ERROR: ${message}`, error),
  warn: (message: string) => console.warn(`WARN: ${message}`)
};

const shutdownManager = new ShutdownManager(customLogger, databaseService, eventBusService);
```

This custom logger will be used for logging information, debug messages, errors, and warnings during the shutdown process.

### Using NoOp Logger

If you don't want any logs to be printed, you can use the `noOpLogger` provided by the library:

```typescript
import { noOpLogger } from 'shutdownmanager';

const shutdownManager = new ShutdownManager(noOpLogger, databaseService, eventBusService);
```

Alternatively, you can pass `null` as the first argument to use the `noOpLogger`:

```typescript
const shutdownManager = new ShutdownManager(null, databaseService, eventBusService);
```

### Triggering a Graceful Shutdown

You can trigger a graceful shutdown manually by sending a `SIGINT` or `SIGTERM` signal to your Node.js application.

```bash
kill -SIGINT <process_id>
```

Or, if you're running the application in a terminal, you can usually trigger a graceful shutdown with `Ctrl+C`.

## Graceful Shutdown

`shutdownmanager` listens for `SIGINT` and `SIGTERM` signals, and it will call the `close` method on each service that has been added to it, allowing you to ensure that resources are properly closed before the application exits.

Your services should aim to handle these closures as gracefully as possible, ensuring that any in-flight operations are completed before shutting down.

## License

ShutdownManager is MIT licensed. See [LICENSE](LICENSE) for details.