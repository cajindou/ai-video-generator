import { Controller, Post, Body } from '@nestjs/common';
import { VideoExpertService } from './video-expert.service';

@Controller('video-expert')
export class VideoExpertController {
  constructor(private readonly videoExpertService: VideoExpertService) {}

  @Post('generate')
  async generateVideo(
    @Body() body: { imageUrls: string[]; extraInfo?: string },
  ) {
    try {
      const result = await this.videoExpertService.generatePromoVideo(
        body.imageUrls,
        body.extraInfo,
      );

      return {
        code: 200,
        msg: 'success',
        data: result,
      };
    } catch (error) {
      console.error('视频生成失败:', error);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null,
      };
    }
  }
}
