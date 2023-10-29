import { ShutdownManager, ServicesToClose, noOpLogger } from './index';
import { defaultLogger } from "./logger";

describe('ShutdownManager', () => {
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

    it('should use noOp logger if null is passed as logger', async () => {
        const infoSpy = jest.spyOn(noOpLogger, 'info');
        const debugSpy = jest.spyOn(noOpLogger, 'debug');
        const errorSpy = jest.spyOn(noOpLogger, 'error');

        new ShutdownManager(null, ...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);

        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
        expect(infoSpy).toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
    });

    it('should use default logger if no logger is passed', async () => {
        const infoSpy = jest.spyOn(defaultLogger, 'info');
        const debugSpy = jest.spyOn(defaultLogger, 'debug');
        const errorSpy = jest.spyOn(defaultLogger, 'error');

        new ShutdownManager(...servicesToClose);
        process.emit('SIGINT');
        await new Promise(setImmediate);

        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
        expect(infoSpy).toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalled();
        expect(errorSpy).not.toHaveBeenCalled();
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

        expect(mockCloseFunction).toHaveBeenCalledTimes(1);
        expect(mockLogger.info).toHaveBeenCalled();
        expect(mockLogger.debug).toHaveBeenCalled();
        expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should log a warning if no services are passed', () => {
        const warnSpy = jest.spyOn(defaultLogger, 'warn');
        const debugSpy = jest.spyOn(defaultLogger, 'debug');

        new ShutdownManager();
        expect(warnSpy).toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalled();
    });
});
