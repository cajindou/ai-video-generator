import { VideoQueueService } from './video-queue.service';
export declare class VideoCallbackController {
    private readonly queueService;
    constructor(queueService: VideoQueueService);
    handleCallback(body: any): Promise<{
        code: number;
        msg: string;
    }>;
}
