import { Request } from 'express';
import { VideoService } from './video.service';
import { VideoQueueService } from './video-queue.service';
import { VIPService } from '../vip/vip.service';
import { DatabaseService } from '../database/database.service';
export declare class VideoController {
    private readonly videoService;
    private readonly queueService;
    private readonly vipService;
    private readonly databaseService;
    constructor(videoService: VideoService, queueService: VideoQueueService, vipService: VIPService, databaseService: DatabaseService);
    checkConfig(): Promise<{
        code: number;
        msg: string;
        data: {
            hasApiKey: boolean;
            apiKeyPrefix: string;
            baseUrl: string;
            modelBaseUrl: string;
            environment: string;
            envVars: {
                hasWorkloadApiKey: boolean;
                hasSimpleApiKey: boolean;
                hasBaseUrl: boolean;
                hasModelBaseUrl: boolean;
                rawWorkloadApiKey: string | undefined;
                rawBaseUrl: string | undefined;
                rawModelBaseUrl: string | undefined;
            };
        };
    }>;
    generateVideo(req: Request): Promise<{
        code: number;
        msg: string;
        data: {
            videoUrl: string;
            copywriting: string;
            storeName: string;
            imageUrls: string[];
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    createAsyncTask(req: Request, body: any): Promise<{
        code: number;
        msg: string;
        data: {
            taskId: string;
            status: "completed" | "failed" | "queued" | "processing";
            message: string;
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    getTaskStatus(taskId: string): Promise<{
        code: number;
        msg: string;
        data: {
            taskId: string;
            status: "completed" | "failed" | "queued" | "processing";
            progress: number;
            result: {
                videoUrl: string;
                copywriting?: string;
            } | undefined;
            error: string | undefined;
            createdAt: Date;
            updatedAt: Date;
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    getUserTasks(userId: string): Promise<{
        code: number;
        msg: string;
        data: {
            taskId: string;
            status: "completed" | "failed" | "queued" | "processing";
            progress: number;
            createdAt: Date;
            updatedAt: Date;
        }[];
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    getQueueStatus(): Promise<{
        code: number;
        msg: string;
        data: {
            total: number;
            queued: number;
            processing: number;
            completed: number;
            failed: number;
            processingTasks: number;
            maxConcurrentTasks: number;
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    private processAsyncTask;
}
