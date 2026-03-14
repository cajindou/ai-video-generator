export interface VideoTask {
    id: string;
    userId?: string;
    imageUrls: string[];
    status: 'queued' | 'processing' | 'completed' | 'failed';
    progress: number;
    result?: {
        videoUrl: string;
        copywriting?: string;
    };
    error?: string;
    createdAt: Date;
    updatedAt: Date;
    taskId?: string;
}
export declare class VideoQueueService {
    private queue;
    private maxConcurrentTasks;
    private processingTasks;
    private taskInterval;
    constructor();
    addTask(imageUrls: string[], userId?: string): VideoTask;
    getTask(taskId: string): VideoTask | undefined;
    getUserTasks(userId: string): VideoTask[];
    updateTask(taskId: string, updates: Partial<VideoTask>): void;
    private startQueueProcessor;
    private processQueue;
    completeTask(taskId: string): void;
    getQueueStatus(): {
        total: number;
        queued: number;
        processing: number;
        completed: number;
        failed: number;
        processingTasks: number;
        maxConcurrentTasks: number;
    };
    cleanupOldTasks(): void;
    stopQueueProcessor(): void;
}
