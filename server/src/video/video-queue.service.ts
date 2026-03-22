import { Injectable } from '@nestjs/common';

export interface ProductAnalysis {
  name: string;
  category: string;
  features: string[];
  painPoints: string[];
  highlights: string[];
  differentiators: string[];
  sellingPoints: string[];
}

export interface VideoTask {
  id: string;
  userId?: string;
  imageUrls: string[];
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  step?: string; // 当前处理步骤
  analysis?: {
    shopName?: string;
    industry?: string;
    industryName?: string;
    products?: ProductAnalysis[];
    overallAtmosphere?: string;
    targetAudience?: string;
  };
  result?: {
    videoUrl: string;
    copywriting?: string;
    storeName?: string;
  };
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  taskId?: string;
}

@Injectable()
export class VideoQueueService {
  private queue: VideoTask[] = [];
  private maxConcurrentTasks = 1; // 最多同时处理1个任务（避免限流）
  private processingTasks = 0;
  private taskInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startQueueProcessor();
  }

  /**
   * 添加任务到队列
   */
  addTask(imageUrls: string[], userId?: string): VideoTask {
    const task: VideoTask = {
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

  /**
   * 获取任务状态
   */
  getTask(taskId: string): VideoTask | undefined {
    return this.queue.find(task => task.id === taskId);
  }

  /**
   * 获取用户的所有任务
   */
  getUserTasks(userId: string): VideoTask[] {
    return this.queue.filter(task => task.userId === userId);
  }

  /**
   * 更新任务状态
   */
  updateTask(taskId: string, updates: Partial<VideoTask>): void {
    const task = this.getTask(taskId);
    if (task) {
      Object.assign(task, updates, { updatedAt: new Date() });
      console.log(`任务状态已更新: ${taskId}, 状态: ${task.status}, 进度: ${task.progress}%`);
    }
  }

  /**
   * 启动队列处理器
   */
  private startQueueProcessor(): void {
    if (this.taskInterval) {
      return;
    }

    this.taskInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // 每秒检查一次队列

    console.log('视频任务队列处理器已启动');
  }

  /**
   * 处理队列中的任务
   */
  private async processQueue(): Promise<void> {
    // 如果正在处理的最大任务数已达到，则不处理新任务
    if (this.processingTasks >= this.maxConcurrentTasks) {
      return;
    }

    // 找到第一个排队中的任务
    const task = this.queue.find(t => t.status === 'queued');

    if (!task) {
      return;
    }

    // 开始处理任务
    this.processingTasks++;
    this.updateTask(task.id, {
      status: 'processing',
      progress: 10,
    });

    console.log(`开始处理任务: ${task.id}, 当前处理中任务数: ${this.processingTasks}`);

    // 任务处理完成后，在调用 updateTask 时将 processingTasks 减 1
    // 这里只是标记任务为处理中状态，实际的视频生成逻辑在 VideoService 中处理
  }

  /**
   * 任务处理完成（由 VideoService 调用）
   */
  completeTask(taskId: string): void {
    this.processingTasks = Math.max(0, this.processingTasks - 1);
    console.log(`任务已完成: ${taskId}, 当前处理中任务数: ${this.processingTasks}`);
  }

  /**
   * 获取队列状态
   */
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

  /**
   * 清理已完成的旧任务（保留最近100个）
   */
  cleanupOldTasks(): void {
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

  /**
   * 停止队列处理器
   */
  stopQueueProcessor(): void {
    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
      console.log('视频任务队列处理器已停止');
    }
  }
}
