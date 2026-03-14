export declare enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4
}
export declare class Logger {
    private module;
    constructor(module: string);
    static setLevel(level: LogLevel): void;
    private getTimestamp;
    private format;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
    success(message: string, ...args: any[]): void;
    performance(operation: string, startTime: number): void;
}
