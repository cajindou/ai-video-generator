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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const vip_service_1 = require("../vip/vip.service");
let AuthService = class AuthService {
    constructor(vipService) {
        this.vipService = vipService;
    }
    async weappLogin(code, userInfo) {
        console.log('[AuthService] 微信小程序登录:', { code, userInfo });
        const appId = process.env.WECHAT_APP_ID;
        const appSecret = process.env.WECHAT_APP_SECRET;
        if (!appId || !appSecret) {
            console.error('[AuthService] 微信 AppID 或 AppSecret 未配置');
            throw new Error('微信配置未完成');
        }
        try {
            const response = await axios_1.default.get(`https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`);
            const data = response.data;
            if (data.errcode) {
                console.error('[AuthService] 微信登录失败:', data);
                throw new Error(`微信登录失败: ${data.errmsg}`);
            }
            const openid = data.openid;
            console.log('[AuthService] 获取 openid 成功:', openid);
            const user = await this.vipService.findOrCreateUser(openid);
            if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
                await this.vipService.updateUser(user.id, {
                    nickname: userInfo.nickName || user.nickname,
                    avatarUrl: userInfo.avatarUrl || user.avatarUrl,
                });
            }
            const quota = await this.vipService.getUserQuota(openid);
            return {
                openid,
                isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000,
                quota,
            };
        }
        catch (error) {
            console.error('[AuthService] 微信登录异常:', error);
            throw error;
        }
    }
    async getUserInfo(openid) {
        const user = await this.vipService.getUserByOpenid(openid);
        const quota = await this.vipService.getUserQuota(openid);
        if (!user) {
            return null;
        }
        return {
            ...user,
            quota,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [vip_service_1.VIPService])
], AuthService);
//# sourceMappingURL=auth.service.js.map