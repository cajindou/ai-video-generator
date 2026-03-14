import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    private readonly logger;
    constructor(authService: AuthService);
    weappLogin(body: {
        code: string;
        userInfo?: {
            nickName?: string;
            avatarUrl?: string;
        };
    }): Promise<{
        code: number;
        msg: string;
        data: {
            openid: string;
            isNewUser: boolean;
            quota: any;
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
    getUserInfo(openid: string): Promise<{
        code: number;
        msg: string;
        data: any;
    }>;
}
