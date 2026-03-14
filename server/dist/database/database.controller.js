"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseController = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("./database.service");
const response_helper_1 = require("../common/response.helper");
let DatabaseController = class DatabaseController {
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async getAllVideoHistory() {
        const history = await this.databaseService.getAllVideoHistory();
        return response_helper_1.ResponseHelper.success(history);
    }
    async getPaginatedVideoHistory(page, pageSize) {
        const pageNum = page ? parseInt(page, 10) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
        const result = await this.databaseService.getPaginatedVideoHistory(pageNum, pageSizeNum);
        return response_helper_1.ResponseHelper.success(result);
    }
    async addVideoHistory(body) {
        await this.databaseService.addVideoHistory(body);
        return response_helper_1.ResponseHelper.success(null, '历史记录添加成功');
    }
    async removeVideoHistory(id) {
        await this.databaseService.removeVideoHistory(id);
        return response_helper_1.ResponseHelper.success(null, '历史记录删除成功');
    }
    async clearVideoHistory() {
        await this.databaseService.clearVideoHistory();
        return response_helper_1.ResponseHelper.success(null, '历史记录已清空');
    }
    async getVideoHistoryStats() {
        const stats = await this.databaseService.getVideoHistoryStats();
        return response_helper_1.ResponseHelper.success(stats);
    }
    async getAllVideoFavorites() {
        const favorites = await this.databaseService.getAllVideoFavorites();
        return response_helper_1.ResponseHelper.success(favorites);
    }
    async isVideoFavorite(videoUrl) {
        const isFav = await this.databaseService.isVideoFavorite(videoUrl);
        return response_helper_1.ResponseHelper.success({ isFavorite: isFav });
    }
    async addVideoFavorite(body) {
        await this.databaseService.addVideoFavorite(body);
        return response_helper_1.ResponseHelper.success(null, '收藏添加成功');
    }
    async removeVideoFavorite(body) {
        await this.databaseService.removeVideoFavorite(body.videoUrl);
        return response_helper_1.ResponseHelper.success(null, '收藏删除成功');
    }
    async clearVideoFavorites() {
        await this.databaseService.clearVideoFavorites();
        return response_helper_1.ResponseHelper.success(null, '收藏已清空');
    }
    async toggleVideoFavorite(body) {
        const isFav = await this.databaseService.toggleVideoFavorite(body);
        return response_helper_1.ResponseHelper.success({ isFavorite: isFav }, isFav ? '已收藏' : '已取消收藏');
    }
    async getUserVideoHistory(openid, page, pageSize) {
        if (!openid) {
            return response_helper_1.ResponseHelper.badRequest('openid 不能为空');
        }
        const pageNum = page ? parseInt(page, 10) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
        const result = await this.databaseService.getUserVideoHistory(openid, pageNum, pageSizeNum);
        return response_helper_1.ResponseHelper.success(result);
    }
    async getUserVideoFavorites(openid, page, pageSize) {
        if (!openid) {
            return response_helper_1.ResponseHelper.badRequest('openid 不能为空');
        }
        const pageNum = page ? parseInt(page, 10) : 1;
        const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10;
        const result = await this.databaseService.getUserVideoFavorites(openid, pageNum, pageSizeNum);
        return response_helper_1.ResponseHelper.success(result);
    }
    async addUserVideoHistory(body) {
        if (!body.openid) {
            return response_helper_1.ResponseHelper.badRequest('openid 不能为空');
        }
        await this.databaseService.addUserVideoHistory(body);
        return response_helper_1.ResponseHelper.success(null, '历史记录添加成功');
    }
    async addUserVideoFavorite(body) {
        if (!body.openid) {
            return response_helper_1.ResponseHelper.badRequest('openid 不能为空');
        }
        const isFav = await this.databaseService.addUserVideoFavorite(body);
        return response_helper_1.ResponseHelper.success({ isFavorite: isFav }, isFav ? '已收藏' : '已取消收藏');
    }
};
exports.DatabaseController = DatabaseController;
__decorate([
    (0, common_1.Get)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getAllVideoHistory", null);
__decorate([
    (0, common_1.Get)('history/paginated'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getPaginatedVideoHistory", null);
__decorate([
    (0, common_1.Post)('history'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "addVideoHistory", null);
__decorate([
    (0, common_1.Delete)('history/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "removeVideoHistory", null);
__decorate([
    (0, common_1.Delete)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "clearVideoHistory", null);
__decorate([
    (0, common_1.Get)('history/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getVideoHistoryStats", null);
__decorate([
    (0, common_1.Get)('favorites'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getAllVideoFavorites", null);
__decorate([
    (0, common_1.Get)('favorites/check'),
    __param(0, (0, common_1.Query)('videoUrl')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "isVideoFavorite", null);
__decorate([
    (0, common_1.Post)('favorites'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "addVideoFavorite", null);
__decorate([
    (0, common_1.Delete)('favorites'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "removeVideoFavorite", null);
__decorate([
    (0, common_1.Delete)('favorites/clear'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "clearVideoFavorites", null);
__decorate([
    (0, common_1.Post)('favorites/toggle'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "toggleVideoFavorite", null);
__decorate([
    (0, common_1.Get)('history/user'),
    __param(0, (0, common_1.Query)('openid')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getUserVideoHistory", null);
__decorate([
    (0, common_1.Get)('favorites/user'),
    __param(0, (0, common_1.Query)('openid')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "getUserVideoFavorites", null);
__decorate([
    (0, common_1.Post)('history/user'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "addUserVideoHistory", null);
__decorate([
    (0, common_1.Post)('favorites/user'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DatabaseController.prototype, "addUserVideoFavorite", null);
exports.DatabaseController = DatabaseController = __decorate([
    (0, common_1.Controller)('database'),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], DatabaseController);
//# sourceMappingURL=database.controller.js.map