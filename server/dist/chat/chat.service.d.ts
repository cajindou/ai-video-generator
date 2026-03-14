export declare class ChatService {
    private client;
    constructor();
    chat(messages: Array<{
        role: string;
        content: string;
    }>): Promise<string>;
}
