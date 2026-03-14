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
exports.VideoCallbackController = void 0;
const common_1 = require("@nestjs/common");
const video_queue_service_1 = require("./video-queue.service");
let VideoCallbackController = class VideoCallbackController {
    constructor(queueService) {
        this.queueService = queueService;
    }
    async handleCallback(body) {
        console.log('收到视频生成回调:', body);
        try {
            const { id: taskId, status, content } = body;
            if (!taskId) {
                console.error('回调缺少任务ID');
                return { code: 400, msg: 'Missing task ID' };
            }
            const task = this.queueService.getTask(taskId);
            if (!task) {
                console.warn(`未找到任务: ${taskId}`);
                return { code: 404, msg: 'Task not found' };
            }
            if (status === 'succeeded' && content?.video_url) {
                this.queueService.updateTask(taskId, {
                    status: 'completed',
                    progress: 100,
                    result: {
                        videoUrl: content.video_url,
                    },
                });
                console.log(`任务 ${taskId} 已完成`);
            }
            else if (status === 'failed') {
                this.queueService.updateTask(taskId, {
                    status: 'failed',
                    error: body.error_message || '视频生成失败',
                });
                console.log(`任务 ${taskId} 失败: ${body.error_message}`);
            }
            else {
                this.queueService.updateTask(taskId, {
                    progress: Math.min(task.progress + 10, 90),
                });
            }
            this.queueService.completeTask(taskId);
            return { code: 200, msg: 'success' };
        }
        catch (error) {
            console.error('处理回调失败:', error);
            return { code: 500, msg: 'Internal server error' };
        }
    }
};
exports.VideoCallbackController = VideoCallbackController;
__decorate([
    (0, common_1.Post)('callback'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoCallbackController.prototype, "handleCallback", null);
exports.VideoCallbackController = VideoCallbackController = __decorate([
    (0, common_1.Controller)('video'),
    __metadata("design:paramtypes", [video_queue_service_1.VideoQueueService])
], VideoCallbackController);
//# sourceMappingURL=video-callback.controller.js.map