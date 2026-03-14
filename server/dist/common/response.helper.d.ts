export declare class ResponseHelper {
    static success<T = any>(data?: T, msg?: string): {
        code: number;
        msg: string;
        data: T | undefined;
    };
    static fail(code?: number, msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static badRequest(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static unauthorized(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static forbidden(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static notFound(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static serverError(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
    static serviceUnavailable(msg?: string, data?: any): {
        code: number;
        msg: string;
        data: any;
    };
}
