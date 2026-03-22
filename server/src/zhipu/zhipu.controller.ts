import { 
  Controller, 
  Post, 
  Body, 
  Headers,
  HttpCode,
  HttpStatus
} from '@nestjs/common';
import { ZhipuService } from './zhipu.service';

@Controller('zhipu')
export class ZhipuController {
  constructor(private readonly zhipuService: ZhipuService) {}

  /**
   * 生成视频接口
   * POST /api/zhipu/generate-video
   */
  @Post('generate-video')
  @HttpCode(HttpStatus.OK)
  async generateVideo(
    @Body() body: { prompt: string; duration?: number },
    @Headers() headers: Record<string, string>,
  ) {
    console.log('[ZhipuController] 收到视频生成请求');
    console.log('[ZhipuController] Prompt:', body.prompt?.substring(0, 100));

    try {
      const result = await this.zhipuService.generateVideo(body.prompt, {
        duration: body.duration || 10,
        ratio: '9:16',
      });

      return {
        code: 200,
        msg: '视频生成成功',
        data: {
          videoUrl: result.videoUrl,
          lastFrameUrl: result.lastFrameUrl,
        },
      };
    } catch (error: any) {
      console.error('[ZhipuController] 视频生成失败:', error.message);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null,
      };
    }
  }

  /**
   * 生成30秒拼接视频
   * POST /api/zhipu/generate-30s-video
   */
  @Post('generate-30s-video')
  @HttpCode(HttpStatus.OK)
  async generate30SecondVideo(
    @Body() body: { imageUrls: string[]; script: string },
    @Headers() headers: Record<string, string>,
  ) {
    console.log('[ZhipuController] 收到30秒视频生成请求');
    console.log('[ZhipuController] 图片数量:', body.imageUrls?.length);
    console.log('[ZhipuController] 文案长度:', body.script?.length);

    if (!body.imageUrls || body.imageUrls.length === 0) {
      return {
        code: 400,
        msg: '请提供至少一张图片',
        data: null,
      };
    }

    if (!body.script) {
      return {
        code: 400,
        msg: '请提供口播文案',
        data: null,
      };
    }

    try {
      const videoUrl = await this.zhipuService.generate30SecondVideo(
        body.imageUrls,
        body.script,
      );

      return {
        code: 200,
        msg: '30秒视频生成成功',
        data: { videoUrl },
      };
    } catch (error: any) {
      console.error('[ZhipuController] 30秒视频生成失败:', error.message);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null,
      };
    }
  }

  /**
   * 测试视频生成
   * GET /api/zhipu/test
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testGenerate() {
    console.log('[ZhipuController] 执行视频生成测试');
    const result = await this.zhipuService.testGenerate();
    return {
      code: result.success ? 200 : 500,
      msg: result.message,
      data: result.videoUrl ? { videoUrl: result.videoUrl } : null,
    };
  }
}
