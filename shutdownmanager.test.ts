import { ShutdownManager, ServicesToClose } from './index';

describe('ShutdownManager', () => {
    it('should call the callback on SIGTERM', (done) => {
        const mockCallback = jest.fn(() => {
            expect(mockCallback).toHaveBeenCalled();
            done();
        });

        const servicesToClose: ServicesToClose[] = [
            {
                close: async (): Promise<void> => {
                    mockCallback();
                }
            }
        ];
        const shutdownManager = new ShutdownManager(...servicesToClose);
        process.emit('SIGTERM');
    });

    it('should call the callback on SIGINT', (done) => {
        const mockCallback = jest.fn(() => {
            expect(mockCallback).toHaveBeenCalled();
            done();
        });

        const servicesToClose: ServicesToClose[] = [
            {
                close: async (): Promise<void> => {
                    mockCallback();
                }
            }
        ];
        const shutdownManager = new ShutdownManager(...servicesToClose);
        process.emit('SIGINT');
    });
});
