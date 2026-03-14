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
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const video_service_1 = require("./video.service");
const video_queue_service_1 = require("./video-queue.service");
const vip_service_1 = require("../vip/vip.service");
const database_service_1 = require("../database/database.service");
let VideoController = class VideoController {
    constructor(videoService, queueService, vipService, databaseService) {
        this.videoService = videoService;
        this.queueService = queueService;
        this.vipService = vipService;
        this.databaseService = databaseService;
    }
    async checkConfig() {
        let apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY || process.env.COZE_API_KEY;
        let baseUrl = process.env.COZE_INTEGRATION_BASE_URL;
        let modelBaseUrl = process.env.COZE_INTEGRATION_MODEL_BASE_URL;
        if (!apiKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
            try {
                const fs = require('fs');
                const path = require('path');
                const envFile = fs.readFileSync(path.join(process.cwd(), '..', '.env.local'), 'utf-8');
                const apiKeyMatch = envFile.match(/COZE_WORKLOAD_IDENTITY_API_KEY=(.+)/);
                if (apiKeyMatch && apiKeyMatch[1]) {
                    apiKey = apiKeyMatch[1].trim();
                }
                const baseUrlMatch = envFile.match(/COZE_INTEGRATION_BASE_URL=(.+)/);
                if (baseUrlMatch && baseUrlMatch[1]) {
                    baseUrl = baseUrlMatch[1].trim();
                }
                const modelBaseUrlMatch = envFile.match(/COZE_INTEGRATION_MODEL_BASE_URL=(.+)/);
                if (modelBaseUrlMatch && modelBaseUrlMatch[1]) {
                    modelBaseUrl = modelBaseUrlMatch[1].trim();
                }
            }
            catch (error) {
                console.error('读取 .env.local 文件失败:', error);
            }
        }
        return {
            code: 200,
            msg: 'success',
            data: {
                hasApiKey: !!apiKey,
                apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
                baseUrl: baseUrl || 'default',
                modelBaseUrl: modelBaseUrl || 'default',
                environment: process.env.NODE_ENV || 'development',
                envVars: {
                    hasWorkloadApiKey: !!process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
                    hasSimpleApiKey: !!process.env.COZE_API_KEY,
                    hasBaseUrl: !!baseUrl,
                    hasModelBaseUrl: !!modelBaseUrl,
                    rawWorkloadApiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
                    rawBaseUrl: process.env.COZE_INTEGRATION_BASE_URL,
                    rawModelBaseUrl: process.env.COZE_INTEGRATION_MODEL_BASE_URL
                }
            }
        };
    }
    async generateVideo(req) {
        console.log('收到视频生成请求，完整 req.body:', JSON.stringify(req.body));
        console.log('Content-Type:', req.headers['content-type']);
        const body = req.body || {};
        const images = body.images || [];
        console.log('收到视频生成请求，图片数量:', images.length);
        console.log('图片URL列表:', images);
        if (!images || images.length === 0) {
            return {
                code: 400,
                msg: '请至少上传1张图片',
                data: null
            };
        }
        try {
            if (body.openid) {
                const hasQuota = await this.vipService.checkUserQuota(body.openid);
                if (!hasQuota) {
                    return {
                        code: 403,
                        msg: '今日免费次数已用完，请购买套餐',
                        data: null
                    };
                }
            }
            const result = await this.videoService.generateVideo(images, req.headers);
            console.log('视频生成服务返回结果:', result);
            console.log('准备返回响应:', {
                code: 200,
                msg: 'success',
                data: result
            });
            if (body.openid && result) {
                await this.vipService.consumeQuota(body.openid);
            }
            if (body.openid && result) {
                await this.databaseService.addUserVideoHistory({
                    openid: body.openid,
                    images: result.imageUrls || [],
                    videoUrl: result.videoUrl,
                    copywriting: result.copywriting,
                    storeName: result.storeName,
                    imageUrls: result.imageUrls || [],
                });
            }
            return {
                code: 200,
                msg: 'success',
                data: result
            };
        }
        catch (error) {
            console.error('视频生成失败:', error);
            return {
                code: 500,
                msg: error.message || '视频生成失败',
                data: null
            };
        }
    }
    async createAsyncTask(req, body) {
        console.log('[createAsyncTask] 收到请求');
        console.log('[createAsyncTask] 请求体:', JSON.stringify(body, null, 2));
        console.log('[createAsyncTask] 图片数组:', body.images);
        console.log('[createAsyncTask] 图片数量:', body.images?.length);
        console.log('[createAsyncTask] 请求头:', JSON.stringify(req.headers, null, 2));
        try {
            if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
                console.error('[createAsyncTask] 图片参数无效');
                return {
                    code: 400,
                    msg: '请上传至少1张图片',
                    data: null
                };
            }
            const task = this.queueService.addTask(body.images, body.userId);
            this.processAsyncTask(task.id, body.images, req.headers);
            return {
                code: 200,
                msg: 'success',
                data: {
                    taskId: task.id,
                    status: task.status,
                    message: '任务已创建，正在排队处理'
                }
            };
        }
        catch (error) {
            console.error('创建异步任务失败:', error);
            return {
                code: 500,
                msg: error.message || '创建任务失败',
                data: null
            };
        }
    }
    async getTaskStatus(taskId) {
        try {
            const task = this.queueService.getTask(taskId);
            if (!task) {
                return {
                    code: 404,
                    msg: 'Task not found',
                    data: null
                };
            }
            return {
                code: 200,
                msg: 'success',
                data: {
                    taskId: task.id,
                    status: task.status,
                    progress: task.progress,
                    result: task.result,
                    error: task.error,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                }
            };
        }
        catch (error) {
            console.error('获取任务状态失败:', error);
            return {
                code: 500,
                msg: error.message || '获取任务状态失败',
                data: null
            };
        }
    }
    async getUserTasks(userId) {
        try {
            const tasks = this.queueService.getUserTasks(userId);
            return {
                code: 200,
                msg: 'success',
                data: tasks.map(task => ({
                    taskId: task.id,
                    status: task.status,
                    progress: task.progress,
                    createdAt: task.createdAt,
                    updatedAt: task.updatedAt,
                }))
            };
        }
        catch (error) {
            console.error('获取用户任务失败:', error);
            return {
                code: 500,
                msg: error.message || '获取用户任务失败',
                data: null
            };
        }
    }
    async getQueueStatus() {
        try {
            const status = this.queueService.getQueueStatus();
            return {
                code: 200,
                msg: 'success',
                data: status
            };
        }
        catch (error) {
            console.error('获取队列状态失败:', error);
            return {
                code: 500,
                msg: error.message || '获取队列状态失败',
                data: null
            };
        }
    }
    async processAsyncTask(taskId, imageUrls, headers) {
        try {
            this.queueService.updateTask(taskId, {
                status: 'processing',
                progress: 20,
            });
            const protocol = process.env.PROTOCOL || 'http';
            const host = process.env.HOST || 'localhost';
            const port = process.env.PORT || '3000';
            const callbackUrl = `${protocol}://${host}:${port}/api/video/callback`;
            console.log(`开始异步处理任务: ${taskId}, 回调URL: ${callbackUrl}`);
            const result = await this.videoService.generateVideoAsync(imageUrls, headers, taskId, callbackUrl);
            this.queueService.updateTask(taskId, {
                status: 'completed',
                progress: 100,
                result: {
                    videoUrl: result.videoUrl,
                    copywriting: result.copywriting,
                },
            });
            this.queueService.completeTask(taskId);
            console.log(`异步任务处理完成: ${taskId}`);
        }
        catch (error) {
            console.error(`异步任务处理失败: ${taskId}`, error);
            this.queueService.updateTask(taskId, {
                status: 'failed',
                error: error.message || '视频生成失败',
            });
            this.queueService.completeTask(taskId);
        }
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Get)('config-check'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "checkConfig", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "generateVideo", null);
__decorate([
    (0, common_1.Post)('create-async-task'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "createAsyncTask", null);
__decorate([
    (0, common_1.Get)('task/:taskId'),
    __param(0, (0, common_1.Param)('taskId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getTaskStatus", null);
__decorate([
    (0, common_1.Get)('tasks/:userId'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getUserTasks", null);
__decorate([
    (0, common_1.Get)('queue-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getQueueStatus", null);
exports.VideoController = VideoController = __decorate([
    (0, common_1.Controller)('video'),
    __metadata("design:paramtypes", [video_service_1.VideoService,
        video_queue_service_1.VideoQueueService,
        vip_service_1.VIPService,
        database_service_1.DatabaseService])
], VideoController);
//# sourceMappingURL=video.controller.js.map