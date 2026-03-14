import { NewVideoHistory, NewVideoFavorites, VideoHistory, VideoFavorites } from '@/database';
export declare class DatabaseService {
    addVideoHistory(item: Omit<NewVideoHistory, 'id' | 'createdAt'>): Promise<void>;
    getAllVideoHistory(): Promise<VideoHistory[]>;
    getPaginatedVideoHistory(page?: number, pageSize?: number): Promise<{
        list: VideoHistory[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    removeVideoHistory(id: string): Promise<void>;
    clearVideoHistory(): Promise<void>;
    getVideoHistoryStats(): Promise<{
        total: number;
        todayCount: number;
        weekCount: number;
    }>;
    addVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<void>;
    getAllVideoFavorites(): Promise<VideoFavorites[]>;
    isVideoFavorite(videoUrl: string): Promise<boolean>;
    removeVideoFavorite(videoUrl: string): Promise<void>;
    clearVideoFavorites(): Promise<void>;
    toggleVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<boolean>;
    initializeDatabase(): Promise<void>;
    getUserVideoHistory(openid: string, page?: number, pageSize?: number): Promise<{
        list: VideoHistory[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    getUserVideoFavorites(openid: string, page?: number, pageSize?: number): Promise<{
        list: VideoFavorites[];
        total: number;
        page: number;
        pageSize: number;
    }>;
    addUserVideoHistory(item: Omit<NewVideoHistory, 'id' | 'createdAt'> & {
        openid: string;
    }): Promise<void>;
    addUserVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'> & {
        openid: string;
    }): Promise<boolean>;
}
