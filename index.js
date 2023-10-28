"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ShutdownManager = void 0;
const logger_1 = require("./logger");
// ShutdownManager is a class that will listen for OS signals and close the services that are passed to it
// when the OS signals are received (SIGINT, SIGTERM)
class ShutdownManager {
    constructor(...args) {
        this.closed = false;
        this.closingPromise = null;
        const lastArg = args[args.length - 1];
        if (typeof lastArg === 'object' && 'info' in lastArg && 'debug' in lastArg && 'error' in lastArg) {
            this.logger = lastArg;
            this.servicesToClose = args.slice(0, -1);
        }
        else {
            this.logger = logger_1.defaultLogger;
            this.servicesToClose = args;
        }
        this.logger.debug('Waiting for OS signals...');
        this.init();
    }
    init() {
        process.on('SIGINT', () => this.close());
        process.on('SIGTERM', () => this.close());
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.closed) {
                this.closed = true;
                this.logger.info('Graceful shutdown initiated.');
                if (!this.closingPromise) {
                    this.closingPromise = this.closeServices();
                }
                yield this.closingPromise;
            }
        });
    }
    closeServices() {
        return __awaiter(this, void 0, void 0, function* () {
            for (const service of this.servicesToClose) {
                try {
                    yield service.close();
                }
                catch (error) {
                    this.logger.error(`Error closing service:`, error instanceof Error ? error : new Error(String(error)));
                }
            }
        });
    }
}
exports.ShutdownManager = ShutdownManager;
