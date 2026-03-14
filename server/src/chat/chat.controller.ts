import { Controller, Post, Body } from '@nestjs/common';
import { ChatService } from './chat.service';
import { HeaderUtils } from 'coze-coding-dev-sdk';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('message')
  async sendMessage(
    @Body() body: { message: string; conversationHistory?: Array<{ role: string; content: string }> },
  ) {
    const { message, conversationHistory = [] } = body;

    // 构建消息历史
    const messages = [
      {
        role: 'system' as const,
        content: `你是在线客服，一个视频创作助手，也是顶级销冠。你的特点是：
1. 友好热情，说话生动活泼
2. 专业能力强，熟悉视频制作全流程
3. 善于引导用户，帮助用户解决问题
4. 使用emoji让对话更有趣
5. 回答要简洁明了，重点突出

你主要帮助用户：
- 生成探店视频
- 上传和管理图片
- 优化视频效果
- 解答使用问题

回答时注意：
- 用emoji增加亲和力
- 分点说明时要清晰
- 适当加入在线客服的个人特色
- 保持积极向上的态度`,
      },
      ...conversationHistory,
      {
        role: 'user' as const,
        content: message,
      },
    ];

    try {
      const reply = await this.chatService.chat(messages);
      return {
        code: 200,
        msg: 'success',
        data: { reply },
      };
    } catch (error: any) {
      console.error('Chat error:', error);
      return {
        code: 500,
        msg: error.message || '对话失败',
        data: null,
      };
    }
  }
}
