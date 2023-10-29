import { ShutdownManager, ServicesToClose, noOpLogger } from './index';
import { defaultLogger } from "./logger";

describe('ShutdownManager - Basic Functionality', () => {
    let mockCloseFunction: jest.Mock;
    let servicesToClose: ServicesToClose[];

    beforeEach(() => {
        mockCloseFunction = jest.fn(() => Promise.resolve());
        servicesToClose = [{ close: mockCloseFunction }];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should call the callback on SIGTERM', async () => {
        new ShutdownManager(...servicesToClose);
        process.emit('SIGTERM');
        await new Promise(setImmediate);
        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
    });

    it('should call the callback on SIGINT', async () => {
        new ShutdownManager(...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);
        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
    });

    it('should log a warning if no services are passed', () => {
        const warnSpy = jest.spyOn(defaultLogger, 'warn');
        new ShutdownManager();
        expect(warnSpy).toHaveBeenCalled();
    });
});

describe('ShutdownManager - Logger', () => {
    let servicesToClose: ServicesToClose[];

    beforeEach(() => {
        servicesToClose = [{ close: jest.fn(() => Promise.resolve()) }];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should use noOp logger if null is passed as logger', async () => {
        const infoSpy = jest.spyOn(noOpLogger, 'info');
        new ShutdownManager(null, ...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);
        expect(infoSpy).toHaveBeenCalled();
    });

    it('should use default logger if no logger is passed', async () => {
        const infoSpy = jest.spyOn(defaultLogger, 'info');
        new ShutdownManager(...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);
        expect(infoSpy).toHaveBeenCalled();
    });

    it('should use the passed logger', async () => {
        const mockLogger = {
            info: jest.fn(),
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
        };
        new ShutdownManager(mockLogger, ...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);
        expect(mockLogger.info).toHaveBeenCalled();
    });
});

describe('ShutdownManager - Timeout and Error Handling', () => {
    let mockCloseFunction: jest.Mock<Promise<void>, []>;
    let failingCloseFunction: jest.Mock<Promise<void>, []>;
    let servicesToClose: ServicesToClose[];

    beforeEach(() => {
        mockCloseFunction = jest.fn(() => Promise.resolve());
        failingCloseFunction = jest.fn(() => Promise.reject(new Error('Service failed to close')));
        servicesToClose = [{ close: mockCloseFunction }, { close: failingCloseFunction }];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should handle service closure failure gracefully', async () => {
        const errorSpy = jest.spyOn(defaultLogger, 'error');
        new ShutdownManager(...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);
        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
        expect(failingCloseFunction).toHaveBeenCalledTimes(1);
        expect(errorSpy).toHaveBeenCalledWith('Error closing service: Service failed to close', new Error('Service failed to close'));
    });

    it('should handle shutdown with timeout', async () => {
        const manager = new ShutdownManager(...servicesToClose);
        await expect(manager.shutdown(500)).resolves.not.toThrow();
    });

    it('should handle timeout correctly if service does not close in time', async () => {
        jest.useFakeTimers();
        const slowCloseFunction = jest.fn(() => new Promise<void>(resolve => setTimeout(() => resolve(), 1000)));
        const manager = new ShutdownManager({ close: slowCloseFunction });
        const shutdownPromise = manager.shutdown(500);
        jest.advanceTimersByTime(1000);
        await expect(shutdownPromise).rejects.toThrow('Shutdown timed out after 500ms');
        jest.useRealTimers();
    });
});

describe('ShutdownManager - Manual Shutdown', () => {
    let mockCloseFunction: jest.Mock;
    let servicesToClose: ServicesToClose[];

    beforeEach(() => {
        mockCloseFunction = jest.fn(() => Promise.resolve());
        servicesToClose = [{ close: mockCloseFunction }];
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should allow manual initiation of shutdown', async () => {
        const manager = new ShutdownManager(...servicesToClose);
        await manager.shutdown();
        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
    });

    it('should handle manual shutdown with timeout', async () => {
        const manager = new ShutdownManager(...servicesToClose);
        await expect(manager.shutdown(500)).resolves.not.toThrow();
        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
    });
});
