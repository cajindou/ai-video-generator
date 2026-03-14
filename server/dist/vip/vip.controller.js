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
var VIPController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VIPController = void 0;
const common_1 = require("@nestjs/common");
const vip_service_1 = require("./vip.service");
const logger_1 = require("../common/logger");
let VIPController = VIPController_1 = class VIPController {
    constructor(vipService) {
        this.vipService = vipService;
        this.logger = new logger_1.Logger(VIPController_1.name);
    }
    async getQuota(openid) {
        this.logger.info(`获取用户配额: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const quota = await this.vipService.getUserQuota(openid);
        return {
            code: 200,
            msg: '获取成功',
            data: quota,
        };
    }
    async checkQuota(openid) {
        this.logger.info(`检查用户配额: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const hasQuota = await this.vipService.checkUserQuota(openid);
        return {
            code: 200,
            msg: '检查成功',
            data: {
                hasQuota,
            },
        };
    }
    async getPlans() {
        this.logger.info('获取所有会员套餐');
        const plans = await this.vipService.getAllActivePlans();
        return {
            code: 200,
            msg: '获取成功',
            data: plans,
        };
    }
    async getUser(openid) {
        this.logger.info(`获取用户信息: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const user = await this.vipService.getUserByOpenid(openid);
        if (!user) {
            return {
                code: 404,
                msg: '用户不存在',
                data: null,
            };
        }
        return {
            code: 200,
            msg: '获取成功',
            data: user,
        };
    }
    async getOrders(openid) {
        this.logger.info(`获取用户订单: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const orders = await this.vipService.getUserOrders(openid);
        return {
            code: 200,
            msg: '获取成功',
            data: orders,
        };
    }
    async activateVIP(body) {
        this.logger.info(`手动开通会员: openid=${body.openid}, planId=${body.planId}`);
        if (!body.openid || !body.planId) {
            return {
                code: 400,
                msg: 'openid 和 planId 不能为空',
                data: null,
            };
        }
        try {
            const result = await this.vipService.activateVIP(body.openid, body.planId);
            return {
                code: 200,
                msg: '会员开通成功',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`开通会员失败: ${error.message}`);
            return {
                code: 500,
                msg: error.message || '开通失败',
                data: null,
            };
        }
    }
    async adminGetUser(openid) {
        this.logger.info(`管理员查询用户: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const user = await this.vipService.getUserByOpenid(openid);
        if (!user) {
            return {
                code: 404,
                msg: '用户不存在',
                data: null,
            };
        }
        return {
            code: 200,
            msg: '获取成功',
            data: user,
        };
    }
    async getAllOrders(page, pageSize) {
        this.logger.info('管理员获取所有订单');
        const pageNum = parseInt(page || '1', 10);
        const pageSizeNum = parseInt(pageSize || '20', 10);
        const result = await this.vipService.getAllOrders(pageNum, pageSizeNum);
        return {
            code: 200,
            msg: '获取成功',
            data: result,
        };
    }
};
exports.VIPController = VIPController;
__decorate([
    (0, common_1.Get)('quota'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "getQuota", null);
__decorate([
    (0, common_1.Get)('check-quota'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "checkQuota", null);
__decorate([
    (0, common_1.Get)('plans'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('user'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "getUser", null);
__decorate([
    (0, common_1.Get)('orders'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "getOrders", null);
__decorate([
    (0, common_1.Post)('admin/activate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "activateVIP", null);
__decorate([
    (0, common_1.Get)('admin/user'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "adminGetUser", null);
__decorate([
    (0, common_1.Get)('admin/orders'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('pageSize')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], VIPController.prototype, "getAllOrders", null);
exports.VIPController = VIPController = VIPController_1 = __decorate([
    (0, common_1.Controller)('vip'),
    __metadata("design:paramtypes", [vip_service_1.VIPService])
], VIPController);
//# sourceMappingURL=vip.controller.js.map