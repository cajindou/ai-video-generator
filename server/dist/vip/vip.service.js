"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIPService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("../database");
const drizzle_orm_1 = require("drizzle-orm");
let VIPService = class VIPService {
    async onModuleInit() {
        await this.initializeVIPPlans();
    }
    async initializeVIPPlans() {
        try {
            const existingPlans = await database_1.db.select().from(database_1.vipPlans).limit(1);
            if (existingPlans.length === 0) {
                console.log('[VIPService] 初始化会员套餐数据...');
                const defaultPlans = [
                    {
                        id: 'plan_basic',
                        name: '基础版',
                        price: 299,
                        quota: 10,
                        description: '每天10次，当天有效，第二天重置，适合轻度用户',
                        duration: 30,
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        id: 'plan_pro',
                        name: '进阶版',
                        price: 399,
                        quota: 20,
                        description: '每天20次，当天有效，第二天重置，适合专业用户',
                        duration: 30,
                        isActive: true,
                        createdAt: new Date(),
                    },
                    {
                        id: 'plan_premium',
                        name: '尊享版',
                        price: 599,
                        quota: -1,
                        description: '30天不限次视频生成，适合重度用户',
                        duration: 30,
                        isActive: true,
                        createdAt: new Date(),
                    },
                ];
                await database_1.db.insert(database_1.vipPlans).values(defaultPlans);
                console.log('[VIPService] 会员套餐数据初始化完成');
            }
        }
        catch (error) {
            console.error('[VIPService] 初始化会员套餐数据失败:', error);
        }
    }
    async findOrCreateUser(openid) {
        const existingUser = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.openid, openid))
            .limit(1);
        if (existingUser.length > 0) {
            return existingUser[0];
        }
        const newUser = {
            id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            openid,
            nickname: null,
            avatarUrl: null,
            isVip: false,
            vipPlanId: null,
            vipExpireAt: null,
            dailyQuota: 3,
            usedQuotaToday: 0,
            lastQuotaResetDate: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await database_1.db.insert(database_1.users).values(newUser);
        return newUser;
    }
    async updateUser(id, data) {
        await database_1.db
            .update(database_1.users)
            .set({ ...data, updatedAt: new Date() })
            .where((0, drizzle_orm_1.eq)(database_1.users.id, id));
    }
    async checkAndResetDailyQuota(userId) {
        const user = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.id, userId))
            .limit(1);
        if (user.length === 0) {
            return;
        }
        const userData = user[0];
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (userData.isVip && userData.vipExpireAt && userData.vipExpireAt < now) {
            await this.updateUser(userId, {
                isVip: false,
                vipPlanId: null,
                vipExpireAt: null,
                dailyQuota: 3,
            });
        }
        if (userData.lastQuotaResetDate) {
            const lastResetDate = new Date(userData.lastQuotaResetDate);
            const lastResetDay = new Date(lastResetDate.getFullYear(), lastResetDate.getMonth(), lastResetDate.getDate());
            if (today > lastResetDay) {
                await this.updateUser(userId, {
                    usedQuotaToday: 0,
                    lastQuotaResetDate: today,
                });
            }
        }
    }
    async getUserQuota(openid) {
        const user = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.openid, openid))
            .limit(1);
        if (user.length === 0) {
            return {
                isVip: false,
                totalQuota: 3,
                usedQuotaToday: 0,
                remainingQuota: 3,
                vipExpireAt: null,
            };
        }
        const userData = user[0];
        await this.checkAndResetDailyQuota(userData.id);
        const refreshedUser = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.id, userData.id))
            .limit(1);
        const finalUser = refreshedUser[0];
        const totalQuota = finalUser.dailyQuota || 3;
        const usedQuotaToday = finalUser.usedQuotaToday || 0;
        const remainingQuota = Math.max(0, totalQuota - usedQuotaToday);
        return {
            isVip: finalUser.isVip || false,
            totalQuota,
            usedQuotaToday,
            remainingQuota,
            vipExpireAt: finalUser.vipExpireAt || null,
        };
    }
    async checkUserQuota(openid) {
        const quota = await this.getUserQuota(openid);
        return quota.remainingQuota > 0;
    }
    async consumeQuota(openid) {
        const user = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.openid, openid))
            .limit(1);
        if (user.length === 0) {
            return false;
        }
        const userData = user[0];
        await this.checkAndResetDailyQuota(userData.id);
        const refreshedUser = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.id, userData.id))
            .limit(1);
        const finalUser = refreshedUser[0];
        const remainingQuota = (finalUser.dailyQuota || 3) - (finalUser.usedQuotaToday || 0);
        if (remainingQuota <= 0) {
            return false;
        }
        await this.updateUser(userData.id, {
            usedQuotaToday: (finalUser.usedQuotaToday || 0) + 1,
        });
        return true;
    }
    async getAllActivePlans() {
        return await database_1.db
            .select()
            .from(database_1.vipPlans)
            .where((0, drizzle_orm_1.eq)(database_1.vipPlans.isActive, true));
    }
    async getPlanById(planId) {
        const plan = await database_1.db
            .select()
            .from(database_1.vipPlans)
            .where((0, drizzle_orm_1.eq)(database_1.vipPlans.id, planId))
            .limit(1);
        return plan.length > 0 ? plan[0] : null;
    }
    async activateVIP(openid, planId) {
        const user = await this.findOrCreateUser(openid);
        const plan = await this.getPlanById(planId);
        if (!plan) {
            throw new Error('套餐不存在');
        }
        const now = new Date();
        const expireAt = new Date();
        expireAt.setDate(expireAt.getDate() + (plan.duration || 30));
        await this.updateUser(user.id, {
            isVip: true,
            vipPlanId: planId,
            vipExpireAt: expireAt,
            dailyQuota: plan.quota,
        });
        const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await database_1.db.insert(database_1.vipOrders).values({
            id: orderId,
            userId: user.id,
            openid,
            planId,
            planName: plan.name,
            amount: plan.price,
            status: 'paid',
            paymentMethod: 'admin_manual',
            paidAt: now,
            createdAt: now,
        });
        return {
            success: true,
            userId: user.id,
            openid,
            planName: plan.name,
            expireAt,
        };
    }
    async getUserByOpenid(openid) {
        const user = await database_1.db
            .select()
            .from(database_1.users)
            .where((0, drizzle_orm_1.eq)(database_1.users.openid, openid))
            .limit(1);
        if (user.length === 0) {
            return null;
        }
        const userData = user[0];
        let planName = null;
        if (userData.vipPlanId) {
            const plan = await this.getPlanById(userData.vipPlanId);
            if (plan) {
                planName = plan.name;
            }
        }
        return {
            ...userData,
            planName,
        };
    }
    async getUserOrders(openid) {
        return await database_1.db
            .select()
            .from(database_1.vipOrders)
            .where((0, drizzle_orm_1.eq)(database_1.vipOrders.openid, openid))
            .orderBy((0, drizzle_orm_1.desc)(database_1.vipOrders.createdAt));
    }
    async getAllOrders(page = 1, pageSize = 20) {
        const allOrders = await database_1.db
            .select()
            .from(database_1.vipOrders)
            .orderBy((0, drizzle_orm_1.desc)(database_1.vipOrders.createdAt));
        const total = allOrders.length;
        const start = (page - 1) * pageSize;
        const list = allOrders.slice(start, start + pageSize);
        return { list, total };
    }
};
exports.VIPService = VIPService;
exports.VIPService = VIPService = __decorate([
    (0, common_1.Injectable)()
], VIPService);
//# sourceMappingURL=vip.service.js.map