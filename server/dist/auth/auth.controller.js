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
var AuthController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const logger_1 = require("../common/logger");
let AuthController = AuthController_1 = class AuthController {
    constructor(authService) {
        this.authService = authService;
        this.logger = new logger_1.Logger(AuthController_1.name);
    }
    async weappLogin(body) {
        this.logger.info(`微信小程序登录: code=${body.code}`);
        if (!body.code) {
            return {
                code: 400,
                msg: 'code 不能为空',
                data: null,
            };
        }
        try {
            const result = await this.authService.weappLogin(body.code, body.userInfo);
            return {
                code: 200,
                msg: result.isNewUser ? '注册成功' : '登录成功',
                data: result,
            };
        }
        catch (error) {
            this.logger.error(`登录失败: ${error.message}`);
            return {
                code: 500,
                msg: error.message || '登录失败',
                data: null,
            };
        }
    }
    async getUserInfo(openid) {
        this.logger.info(`获取用户信息: openid=${openid}`);
        if (!openid) {
            return {
                code: 400,
                msg: 'openid 不能为空',
                data: null,
            };
        }
        const userInfo = await this.authService.getUserInfo(openid);
        if (!userInfo) {
            return {
                code: 404,
                msg: '用户不存在',
                data: null,
            };
        }
        return {
            code: 200,
            msg: '获取成功',
            data: userInfo,
        };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('weapp/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "weappLogin", null);
__decorate([
    (0, common_1.Get)('user'),
    __param(0, (0, common_1.Query)('openid')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getUserInfo", null);
exports.AuthController = AuthController = AuthController_1 = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map