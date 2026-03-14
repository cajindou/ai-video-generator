import { OnModuleInit } from '@nestjs/common';
export declare class VIPService implements OnModuleInit {
    onModuleInit(): Promise<void>;
    private initializeVIPPlans;
    findOrCreateUser(openid: string): Promise<any>;
    updateUser(id: string, data: Partial<any>): Promise<void>;
    checkAndResetDailyQuota(userId: string): Promise<void>;
    getUserQuota(openid: string): Promise<{
        isVip: boolean;
        totalQuota: number;
        usedQuotaToday: number;
        remainingQuota: number;
        vipExpireAt: Date | null;
    }>;
    checkUserQuota(openid: string): Promise<boolean>;
    consumeQuota(openid: string): Promise<boolean>;
    getAllActivePlans(): Promise<any[]>;
    getPlanById(planId: string): Promise<any>;
    activateVIP(openid: string, planId: string): Promise<any>;
    getUserByOpenid(openid: string): Promise<any>;
    getUserOrders(openid: string): Promise<any[]>;
    getAllOrders(page?: number, pageSize?: number): Promise<{
        list: any[];
        total: number;
    }>;
}
