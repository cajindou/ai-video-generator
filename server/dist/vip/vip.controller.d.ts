import { VIPService } from './vip.service';
export declare class VIPController {
    private readonly vipService;
    private readonly logger;
    constructor(vipService: VIPService);
    getQuota(openid: string): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: {
            isVip: boolean;
            totalQuota: number;
            usedQuotaToday: number;
            remainingQuota: number;
            vipExpireAt: Date | null;
        };
    }>;
    checkQuota(openid: string): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: {
            hasQuota: boolean;
        };
    }>;
    getPlans(): Promise<{
        code: number;
        msg: string;
        data: any[];
    }>;
    getUser(openid: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getOrders(openid: string): Promise<{
        code: number;
        msg: string;
        data: null;
    } | {
        code: number;
        msg: string;
        data: any[];
    }>;
    activateVIP(body: {
        openid: string;
        planId: string;
    }): Promise<{
        code: number;
        msg: string;
        data: any;
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    adminGetUser(openid: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getAllOrders(page?: string, pageSize?: string): Promise<{
        code: number;
        msg: string;
        data: {
            list: any[];
            total: number;
        };
    }>;
}
