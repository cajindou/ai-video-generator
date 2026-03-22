import { Injectable } from '@nestjs/common';
import { LLMClient, Config, Message } from 'coze-coding-dev-sdk';

@Injectable()
export class ChatService {
  private client: LLMClient;

  constructor() {
    const config = new Config();
    this.client = new LLMClient(config);
  }

  async chat(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // 转换消息类型
      const typedMessages: Message[] = messages.map(m => ({
        role: m.role as 'system' | 'user' | 'assistant',
        content: m.content
      }));

      // 使用流式调用
      let fullResponse = '';
      
      const stream = this.client.stream(
        typedMessages,
        {
          model: 'doubao-seed-1-8-251228',
          temperature: 0.8,
          caching: 'enabled',
        }
      );

      for await (const chunk of stream) {
        if (chunk.content) {
          fullResponse += chunk.content.toString();
        }
      }

      return fullResponse;
    } catch (error: any) {
      console.error('LLM service error:', error);
      throw new Error(error.message || 'LLM调用失败');
    }
  }
}
