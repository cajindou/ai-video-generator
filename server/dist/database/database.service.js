"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("./");
const drizzle_orm_1 = require("drizzle-orm");
let DatabaseService = class DatabaseService {
    async addVideoHistory(item) {
        const newItem = {
            ...item,
            id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
        };
        await database_1.db.insert(database_1.videoHistory).values(newItem);
        const allHistory = await database_1.db
            .select()
            .from(database_1.videoHistory)
            .orderBy((0, drizzle_orm_1.desc)(database_1.videoHistory.createdAt));
        if (allHistory.length > 50) {
            const toDelete = allHistory.slice(50);
            for (const record of toDelete) {
                await database_1.db.delete(database_1.videoHistory).where((0, drizzle_orm_1.eq)(database_1.videoHistory.id, record.id));
            }
        }
    }
    async getAllVideoHistory() {
        return await database_1.db
            .select()
            .from(database_1.videoHistory)
            .orderBy((0, drizzle_orm_1.desc)(database_1.videoHistory.createdAt));
    }
    async getPaginatedVideoHistory(page = 1, pageSize = 10) {
        const allHistory = await this.getAllVideoHistory();
        const total = allHistory.length;
        const start = (page - 1) * pageSize;
        const list = allHistory.slice(start, start + pageSize);
        return { list, total, page, pageSize };
    }
    async removeVideoHistory(id) {
        await database_1.db.delete(database_1.videoHistory).where((0, drizzle_orm_1.eq)(database_1.videoHistory.id, id));
    }
    async clearVideoHistory() {
        await database_1.db.delete(database_1.videoHistory);
    }
    async getVideoHistoryStats() {
        const allHistory = await this.getAllVideoHistory();
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const todayCount = allHistory.filter((item) => item.createdAt >= todayStart).length;
        const weekCount = allHistory.filter((item) => item.createdAt >= weekStart).length;
        return {
            total: allHistory.length,
            todayCount,
            weekCount,
        };
    }
    async addVideoFavorite(item) {
        const existing = await database_1.db
            .select()
            .from(database_1.videoFavorites)
            .where((0, drizzle_orm_1.eq)(database_1.videoFavorites.videoUrl, item.videoUrl))
            .limit(1);
        if (existing.length > 0) {
            return;
        }
        const newItem = {
            ...item,
            id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
        };
        await database_1.db.insert(database_1.videoFavorites).values(newItem);
    }
    async getAllVideoFavorites() {
        return await database_1.db
            .select()
            .from(database_1.videoFavorites)
            .orderBy((0, drizzle_orm_1.desc)(database_1.videoFavorites.createdAt));
    }
    async isVideoFavorite(videoUrl) {
        const existing = await database_1.db
            .select()
            .from(database_1.videoFavorites)
            .where((0, drizzle_orm_1.eq)(database_1.videoFavorites.videoUrl, videoUrl))
            .limit(1);
        return existing.length > 0;
    }
    async removeVideoFavorite(videoUrl) {
        await database_1.db.delete(database_1.videoFavorites).where((0, drizzle_orm_1.eq)(database_1.videoFavorites.videoUrl, videoUrl));
    }
    async clearVideoFavorites() {
        await database_1.db.delete(database_1.videoFavorites);
    }
    async toggleVideoFavorite(item) {
        const isFav = await this.isVideoFavorite(item.videoUrl);
        if (isFav) {
            await this.removeVideoFavorite(item.videoUrl);
            return false;
        }
        else {
            await this.addVideoFavorite(item);
            return true;
        }
    }
    async initializeDatabase() {
        try {
            await this.getAllVideoHistory();
            await this.getAllVideoFavorites();
            console.log('[DatabaseService] 数据库初始化成功');
        }
        catch (error) {
            console.error('[DatabaseService] 数据库初始化失败:', error);
            throw error;
        }
    }
    async getUserVideoHistory(openid, page = 1, pageSize = 10) {
        const allHistory = await this.getAllVideoHistory();
        const userHistory = allHistory.filter(item => item.openid === openid);
        const total = userHistory.length;
        const start = (page - 1) * pageSize;
        const list = userHistory.slice(start, start + pageSize);
        return { list, total, page, pageSize };
    }
    async getUserVideoFavorites(openid, page = 1, pageSize = 10) {
        const allFavorites = await this.getAllVideoFavorites();
        const userFavorites = allFavorites.filter(item => item.openid === openid);
        const total = userFavorites.length;
        const start = (page - 1) * pageSize;
        const list = userFavorites.slice(start, start + pageSize);
        return { list, total, page, pageSize };
    }
    async addUserVideoHistory(item) {
        await this.addVideoHistory(item);
    }
    async addUserVideoFavorite(item) {
        const existing = await database_1.db
            .select()
            .from(database_1.videoFavorites)
            .where((0, drizzle_orm_1.eq)(database_1.videoFavorites.videoUrl, item.videoUrl))
            .limit(1);
        if (existing.length > 0) {
            await this.removeVideoFavorite(item.videoUrl);
            return false;
        }
        const newItem = {
            ...item,
            id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: new Date(),
        };
        await database_1.db.insert(database_1.videoFavorites).values(newItem);
        return true;
    }
};
exports.DatabaseService = DatabaseService;
exports.DatabaseService = DatabaseService = __decorate([
    (0, common_1.Injectable)()
], DatabaseService);
//# sourceMappingURL=database.service.js.map