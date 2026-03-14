import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    sendMessage(body: {
        message: string;
        conversationHistory?: Array<{
            role: string;
            content: string;
        }>;
    }): Promise<{
        code: number;
        msg: string;
        data: {
            reply: string;
        };
    } | {
        code: number;
        msg: any;
        data: null;
    }>;
}
