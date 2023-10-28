# shutdownmanager

ShutdownManager is a lightweight TypeScript library designed to manage the graceful shutdown of services in a Node.js application.
It listens for OS signals `(SIGINT, SIGTERM)` and ensures that all registered services are properly closed before the application exits. 
This is especially useful for releasing database connections, closing file streams, or cleaning up resources to prevent data corruption and ensure a smooth restart.

## Installation

```bash
npm install shutdownmanager
```

or

```bash
npm install shutdownmanager --registry=https://npm.pkg.github.com
```

## Usage

### Basic Example

First, import the `ShutdownManager`:

```typescript
import { ShutdownManager } from 'shutdownmanager';
```

or 

```javascript
const { ShutdownManager } = require('shutdownmanager');
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

### Using a Custom Logger

To use a custom logger, pass it as the first argument to the `ShutdownManager` constructor. Ensure that your logger has `info`, `debug`, and `error` methods.

```typescript
const customLogger = {
  info: (message: string) => console.log(`INFO: ${message}`),
  debug: (message: string) => console.log(`DEBUG: ${message}`),
  error: (message: string, error: Error) => console.error(`ERROR: ${message}`, error),
};

const shutdownManager = new ShutdownManager(customLogger, databaseService, eventBusService);
```

This custom logger will be used for logging information, debug messages, and errors during the shutdown process.

### Triggering a Graceful Shutdown
   You can trigger a graceful shutdown manually by sending a SIGINT or SIGTERM signal to your Node.js application.

```bash
kill -SIGINT <process_id>
```
Or, if you're running the application in a terminal, you can usually trigger a graceful shutdown with Ctrl+C.

## Graceful Shutdown

`shutdownmanager` listens for `SIGINT` and `SIGTERM` signals, and it will call the `close` method on each service that has been added to it, allowing you to ensure that resources are properly closed before the application exits.

Your services should aim to handle these closures as gracefully as possible, ensuring that any in-flight operations are completed before shutting down.

### License
ShutdownManager is MIT licensed. See [LICENSE](LICENSE) for details.