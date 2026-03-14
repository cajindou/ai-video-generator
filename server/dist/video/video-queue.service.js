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
exports.VideoQueueService = void 0;
const common_1 = require("@nestjs/common");
let VideoQueueService = class VideoQueueService {
    constructor() {
        this.queue = [];
        this.maxConcurrentTasks = 1;
        this.processingTasks = 0;
        this.taskInterval = null;
        this.startQueueProcessor();
    }
    addTask(imageUrls, userId) {
        const task = {
            id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            userId,
            imageUrls,
            status: 'queued',
            progress: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        this.queue.push(task);
        console.log(`任务已添加到队列: ${task.id}, 队列长度: ${this.queue.length}`);
        return task;
    }
    getTask(taskId) {
        return this.queue.find(task => task.id === taskId);
    }
    getUserTasks(userId) {
        return this.queue.filter(task => task.userId === userId);
    }
    updateTask(taskId, updates) {
        const task = this.getTask(taskId);
        if (task) {
            Object.assign(task, updates, { updatedAt: new Date() });
            console.log(`任务状态已更新: ${taskId}, 状态: ${task.status}, 进度: ${task.progress}%`);
        }
    }
    startQueueProcessor() {
        if (this.taskInterval) {
            return;
        }
        this.taskInterval = setInterval(() => {
            this.processQueue();
        }, 1000);
        console.log('视频任务队列处理器已启动');
    }
    async processQueue() {
        if (this.processingTasks >= this.maxConcurrentTasks) {
            return;
        }
        const task = this.queue.find(t => t.status === 'queued');
        if (!task) {
            return;
        }
        this.processingTasks++;
        this.updateTask(task.id, {
            status: 'processing',
            progress: 10,
        });
        console.log(`开始处理任务: ${task.id}, 当前处理中任务数: ${this.processingTasks}`);
    }
    completeTask(taskId) {
        this.processingTasks = Math.max(0, this.processingTasks - 1);
        console.log(`任务已完成: ${taskId}, 当前处理中任务数: ${this.processingTasks}`);
    }
    getQueueStatus() {
        return {
            total: this.queue.length,
            queued: this.queue.filter(t => t.status === 'queued').length,
            processing: this.queue.filter(t => t.status === 'processing').length,
            completed: this.queue.filter(t => t.status === 'completed').length,
            failed: this.queue.filter(t => t.status === 'failed').length,
            processingTasks: this.processingTasks,
            maxConcurrentTasks: this.maxConcurrentTasks,
        };
    }
    cleanupOldTasks() {
        const completedTasks = this.queue.filter(t => t.status === 'completed' || t.status === 'failed');
        if (completedTasks.length > 100) {
            const tasksToRemove = completedTasks.slice(0, completedTasks.length - 100);
            tasksToRemove.forEach(task => {
                const index = this.queue.findIndex(t => t.id === task.id);
                if (index !== -1) {
                    this.queue.splice(index, 1);
                }
            });
            console.log(`已清理 ${tasksToRemove.length} 个旧任务`);
        }
    }
    stopQueueProcessor() {
        if (this.taskInterval) {
            clearInterval(this.taskInterval);
            this.taskInterval = null;
            console.log('视频任务队列处理器已停止');
        }
    }
};
exports.VideoQueueService = VideoQueueService;
exports.VideoQueueService = VideoQueueService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], VideoQueueService);
//# sourceMappingURL=video-queue.service.js.map