import { shutdown, defaultShutdownManager } from './index';

describe('ShutdownManager Decorator', () => {
    beforeEach(() => {
        // Reset defaultShutdownManager state
        (defaultShutdownManager as any).servicesToClose = [];
        (defaultShutdownManager as any).closed = false;
        (defaultShutdownManager as any).closingPromise = null;
        // Also need to reset the shutdownInitiatedPromise?
        // It's a readonly promise created in constructor. This might be hard.
        // Let's see if we can just create a new manager for each test if needed,
        // but the decorator is hardcoded to defaultShutdownManager.
    });

    it('should register an instance with the default manager', () => {
        class MyService {
            @shutdown()
            async stop() {}
        }
        new MyService();
        expect(defaultShutdownManager.getServices().length).toBe(1);
    });

    it('should register multiple instances of the same class', () => {
        class MyService {
            @shutdown()
            async stop() {}
        }
        new MyService();
        new MyService();
        expect(defaultShutdownManager.getServices().length).toBe(2);
    });

    it('should call the decorated method on shutdown', async () => {
        const mockStop = jest.fn().mockResolvedValue(undefined);
        class MyService {
            @shutdown()
            async stop() {
                await mockStop();
            }
        }
        new MyService();
        await defaultShutdownManager.shutdown();
        expect(mockStop).toHaveBeenCalledTimes(1);
    });

    it('should call multiple decorated methods in the same class', async () => {
        const mockStop1 = jest.fn().mockResolvedValue(undefined);
        const mockStop2 = jest.fn().mockResolvedValue(undefined);
        class MyService {
            @shutdown()
            async stop1() {
                await mockStop1();
            }
            @shutdown()
            async stop2() {
                await mockStop2();
            }
        }
        new MyService();
        await defaultShutdownManager.shutdown();
        expect(mockStop1).toHaveBeenCalledTimes(1);
        expect(mockStop2).toHaveBeenCalledTimes(1);
    });

    it('should respect the timeout in the decorator', async () => {
        jest.useFakeTimers();
        const slowStop = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
        class MyService {
            @shutdown(500)
            async stop() {
                await slowStop();
            }
        }
        new MyService();

        const shutdownPromise = defaultShutdownManager.shutdown();

        jest.advanceTimersByTime(600);

        await shutdownPromise;

        expect(slowStop).toHaveBeenCalled();
        jest.useRealTimers();
    });

    it('should work with multiple instances having different timeouts', async () => {
        const stop1 = jest.fn().mockResolvedValue(undefined);
        const stop2 = jest.fn().mockResolvedValue(undefined);
        class MyService {
            @shutdown(100)
            async s1() { await stop1(); }
            @shutdown(200)
            async s2() { await stop2(); }
        }
        new MyService();
        await defaultShutdownManager.shutdown();
        expect(stop1).toHaveBeenCalled();
        expect(stop2).toHaveBeenCalled();
    });

    it('should handle errors in decorated methods gracefully', async () => {
        const errorSpy = jest.spyOn((defaultShutdownManager as any).logger, 'error').mockImplementation(() => {});
        class MyService {
            @shutdown()
            async stop() {
                throw new Error('Boom');
            }
        }
        new MyService();
        await defaultShutdownManager.shutdown();
        expect(errorSpy).toHaveBeenCalledWith('Error closing service: Boom', expect.any(Error));
        errorSpy.mockRestore();
    });
});
