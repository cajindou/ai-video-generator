"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
    LogLevel[LogLevel["NONE"] = 4] = "NONE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
let currentLevel = LogLevel.DEBUG;
class Logger {
    constructor(module) {
        this.module = module;
    }
    static setLevel(level) {
        currentLevel = level;
    }
    getTimestamp() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const ms = String(now.getMilliseconds()).padStart(3, '0');
        return `${hours}:${minutes}:${seconds}.${ms}`;
    }
    format(level, message, ...args) {
        if (currentLevel > LogLevel[level]) {
            return;
        }
        const timestamp = this.getTimestamp();
        const prefix = `[${timestamp}] [${level}] [${this.module}]`;
        switch (level) {
            case 'ERROR':
                console.error(prefix, message, ...args);
                break;
            case 'WARN':
                console.warn(prefix, message, ...args);
                break;
            default:
                console.log(prefix, message, ...args);
        }
    }
    debug(message, ...args) {
        this.format('DEBUG', message, ...args);
    }
    info(message, ...args) {
        this.format('INFO', message, ...args);
    }
    warn(message, ...args) {
        this.format('WARN', message, ...args);
    }
    error(message, ...args) {
        this.format('ERROR', message, ...args);
    }
    success(message, ...args) {
        if (currentLevel > LogLevel.INFO) {
            return;
        }
        const timestamp = this.getTimestamp();
        const prefix = `\x1b[32m[${timestamp}] [SUCCESS] [${this.module}]\x1b[0m`;
        console.log(prefix, message, ...args);
    }
    performance(operation, startTime) {
        const endTime = Date.now();
        const duration = endTime - startTime;
        this.info(`${operation} 耗时: ${duration}ms`);
    }
}
exports.Logger = Logger;
if (process.env.NODE_ENV === 'production') {
    Logger.setLevel(LogLevel.INFO);
}
else {
    Logger.setLevel(LogLevel.DEBUG);
}
//# sourceMappingURL=logger.js.map