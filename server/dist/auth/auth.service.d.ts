import { VIPService } from '@/vip/vip.service';
export declare class AuthService {
    private readonly vipService;
    constructor(vipService: VIPService);
    weappLogin(code: string, userInfo?: {
        nickName?: string;
        avatarUrl?: string;
    }): Promise<{
        openid: string;
        isNewUser: boolean;
        quota: any;
    }>;
    getUserInfo(openid: string): Promise<any>;
}
