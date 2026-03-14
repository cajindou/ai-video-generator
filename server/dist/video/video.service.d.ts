export declare class VideoService {
    private llmClient;
    private videoGenerationClient;
    private config;
    private uploadDir;
    private apiKey;
    private baseUrl;
    constructor();
    private videoCache;
    private generateCacheKey;
    private checkCache;
    private updateCache;
    generateVideo(imageUrls: string[], headers?: Record<string, string>, customInput?: string): Promise<{
        videoUrl: string;
        copywriting: string;
        storeName: string;
        imageUrls: string[];
    }>;
    generateVideoAsync(imageUrls: string[], headers?: Record<string, string>, taskId?: string, callbackUrl?: string): Promise<{
        videoUrl: string;
        copywriting: string;
        storeName: string;
        imageUrls: string[];
    }>;
    private imageUrlsToBase64;
    private analyzeImages;
    private generateCopywriting;
    private splitCopywritingIntoSegments;
    private generateVideoSegment;
    private generateFreeVideoSegment;
    private generateCompleteVideoWithFFmpeg;
    private generateVideoFromMultipleImagesWithFFmpeg;
    private buildConcatFilter;
    private generateVideoFromImageWithFFmpeg;
    private downloadImage;
    private buildVideoPrompt;
    private mergeVideoSegmentsWithTransitions;
    private downloadVideo;
    private mergeVideosFFmpeg;
    private buildFilterComplex;
    private uploadVideoToOSS;
    private pollVideoResult;
    private generateSceneDescriptions;
    private generateVideoWithRetry;
    private sleep;
    private generateVideoDirect;
    private generateVideoDirectAsync;
}
