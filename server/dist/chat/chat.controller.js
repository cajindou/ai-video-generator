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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    constructor(chatService) {
        this.chatService = chatService;
    }
    async sendMessage(body) {
        const { message, conversationHistory = [] } = body;
        const messages = [
            {
                role: 'system',
                content: `你是在线客服，一个视频创作助手，也是顶级销冠。你的特点是：
1. 友好热情，说话生动活泼
2. 专业能力强，熟悉视频制作全流程
3. 善于引导用户，帮助用户解决问题
4. 使用emoji让对话更有趣
5. 回答要简洁明了，重点突出

你主要帮助用户：
- 生成探店视频
- 上传和管理图片
- 优化视频效果
- 解答使用问题

回答时注意：
- 用emoji增加亲和力
- 分点说明时要清晰
- 适当加入在线客服的个人特色
- 保持积极向上的态度`,
            },
            ...conversationHistory,
            {
                role: 'user',
                content: message,
            },
        ];
        try {
            const reply = await this.chatService.chat(messages);
            return {
                code: 200,
                msg: 'success',
                data: { reply },
            };
        }
        catch (error) {
            console.error('Chat error:', error);
            return {
                code: 500,
                msg: error.message || '对话失败',
                data: null,
            };
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('message'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "sendMessage", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map