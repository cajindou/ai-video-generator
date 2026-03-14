import { DatabaseService } from './database.service';
export declare class DatabaseController {
    private readonly databaseService;
    constructor(databaseService: DatabaseService);
    getAllVideoHistory(): Promise<{
        code: number;
        msg: string;
        data: {
            videoUrl: string;
            copywriting: string | null;
            imageUrls: string[] | null;
            storeName: string | null;
            id: string;
            userId: string | null;
            createdAt: Date;
            openid: string | null;
            images: string[] | null;
            thumbnail: string | null;
        }[] | undefined;
    }>;
    getPaginatedVideoHistory(page?: string, pageSize?: string): Promise<{
        code: number;
        msg: string;
        data: {
            list: import("./schema").VideoHistory[];
            total: number;
            page: number;
            pageSize: number;
        } | undefined;
    }>;
    addVideoHistory(body: any): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    removeVideoHistory(id: string): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    clearVideoHistory(): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    getVideoHistoryStats(): Promise<{
        code: number;
        msg: string;
        data: {
            total: number;
            todayCount: number;
            weekCount: number;
        } | undefined;
    }>;
    getAllVideoFavorites(): Promise<{
        code: number;
        msg: string;
        data: {
            videoUrl: string;
            storeName: string | null;
            id: string;
            userId: string | null;
            createdAt: Date;
            openid: string | null;
            thumbnail: string | null;
            title: string | null;
            author: string | null;
            avatar: string | null;
            coverImage: string | null;
            views: number | null;
            likes: number | null;
            category: string | null;
        }[] | undefined;
    }>;
    isVideoFavorite(videoUrl: string): Promise<{
        code: number;
        msg: string;
        data: {
            isFavorite: boolean;
        } | undefined;
    }>;
    addVideoFavorite(body: any): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    removeVideoFavorite(body: {
        videoUrl: string;
    }): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    clearVideoFavorites(): Promise<{
        code: number;
        msg: string;
        data: null | undefined;
    }>;
    toggleVideoFavorite(body: any): Promise<{
        code: number;
        msg: string;
        data: {
            isFavorite: boolean;
        } | undefined;
    }>;
    getUserVideoHistory(openid: string, page?: string, pageSize?: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    getUserVideoFavorites(openid: string, page?: string, pageSize?: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    addUserVideoHistory(body: any): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
    addUserVideoFavorite(body: any): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
}
