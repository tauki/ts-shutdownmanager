"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.logger = void 0;
const winston_1 = __importStar(require("winston"));
function errorToObject(error) {
    return {
        message: error.message,
        name: error.name,
        stack: error.stack,
    };
}
const openTelemetryFormat = winston_1.format.printf((_a) => {
    var { level, message, timestamp, error } = _a, params = __rest(_a, ["level", "message", "timestamp", "error"]);
    const baseAttributes = {
        level,
        timestamp,
    };
    const errorAttributes = error ? { error: JSON.stringify(error) } : {};
    const paramAttributes = params ? Object.assign({}, params) : {};
    const attributes = Object.assign(Object.assign(Object.assign({}, baseAttributes), errorAttributes), paramAttributes);
    return JSON.stringify(Object.assign({ message: `${message}${error ? ` - Error: ${JSON.stringify(error)}` : ''}` }, attributes));
});
class logger {
    constructor() {
        // create logger
        this.logger = winston_1.default.createLogger({
            level: 'debug',
            format: openTelemetryFormat,
            transports: [
                new winston_1.default.transports.Console(),
            ],
            handleExceptions: true,
            exitOnError: false,
        });
    }
    mergeParams(params) {
        return Object.assign({}, ...params);
    }
    info(message, ...params) {
        this.logger.info(message, this.mergeParams(params));
    }
    debug(message, ...params) {
        this.logger.debug(message, this.mergeParams(params));
    }
    error(message, error, ...params) {
        this.mergeParams(params);
        this.logger.error(message, Object.assign({ error: errorToObject(error) }, this.mergeParams(params)));
    }
}
exports.logger = logger;
const loggerInstance = new logger();
exports.defaultLogger = loggerInstance;
