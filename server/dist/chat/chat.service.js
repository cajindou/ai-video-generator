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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const coze_coding_dev_sdk_1 = require("coze-coding-dev-sdk");
let ChatService = class ChatService {
    constructor() {
        const config = new coze_coding_dev_sdk_1.Config();
        this.client = new coze_coding_dev_sdk_1.LLMClient(config);
    }
    async chat(messages) {
        try {
            const typedMessages = messages.map(m => ({
                role: m.role,
                content: m.content
            }));
            let fullResponse = '';
            const stream = this.client.stream(typedMessages, {
                model: 'doubao-seed-1-8-251228',
                temperature: 0.8,
                caching: 'enabled',
            });
            for await (const chunk of stream) {
                if (chunk.content) {
                    fullResponse += chunk.content.toString();
                }
            }
            return fullResponse;
        }
        catch (error) {
            console.error('LLM service error:', error);
            throw new Error(error.message || 'LLM调用失败');
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], ChatService);
//# sourceMappingURL=chat.service.js.map