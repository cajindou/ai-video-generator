import { Controller, Post, Get, Body, Query, Headers } from '@nestjs/common';
import { ExpertPipelineService } from './expert-pipeline.service';

/**
 * 专家流水线控制器
 * 
 * API流程：
 * 1. POST /api/video-expert/preview - 预览分析结果（不生成视频）
 * 2. POST /api/video-expert/confirm - 用户确认后生成视频
 */

@Controller('video-expert')
export class ExpertPipelineController {
  constructor(private readonly expertPipelineService: ExpertPipelineService) {}

  /**
   * 步骤1: 预览模式
   * 分析图片、生成文案、制作分镜，但不生成视频
   * 返回结果供用户确认
   */
  @Post('preview')
  async preview(
    @Body() body: { images: string[]; extraInfo?: string },
    @Headers() headers: Record<string, string>
  ) {
    console.log('[ExpertPipelineController] 收到预览请求');
    console.log('  图片数量:', body.images?.length);
    console.log('  额外信息:', body.extraInfo || '无');

    try {
      // 验证输入
      if (!body.images || body.images.length < 3) {
        return {
          code: 400,
          msg: '请上传至少3张图片',
          data: null
        };
      }

      if (body.images.length > 5) {
        return {
          code: 400,
          msg: '最多上传5张图片',
          data: null
        };
      }

      // 调用预览服务
      const result = await this.expertPipelineService.previewGeneration({
        imageUrls: body.images,
        extraInfo: body.extraInfo
      });

      // 构建完整返回数据
      const presenter = result.presenter || {
        name: '小悦',
        age: '22-26',
        appearance: '甜美知性的亚洲女性',
        clothing: '时尚休闲',
        personality: '热情专业、亲和力强',
        catchphrases: ['挖到宝啦', '绝了', '赶紧冲'],
        signatureMoves: ['单手托腮', '双手比心'],
        voiceStyle: '甜美知性'
      };

      return {
        code: 200,
        msg: '预览分析完成，请确认后生成视频',
        data: {
          imageAnalysis: result.imageAnalysis,
          script: result.script,
          storyboard: result.storyboard,
          presenter: presenter,
          discussions: result.discussions || [],
          previewReady: result.previewReady,
          // 提示用户确认
          confirmationRequired: true,
          confirmEndpoint: '/api/video-expert/confirm'
        }
      };
    } catch (error) {
      console.error('[ExpertPipelineController] 预览失败:', error);
      return {
        code: 500,
        msg: error.message || '预览分析失败',
        data: null
      };
    }
  }

  /**
   * 步骤2: 确认并生成视频
   * 用户确认后才能调用此接口
   */
  @Post('confirm')
  async confirmAndGenerate(
    @Body() body: { 
      images: string[]; 
      extraInfo?: string;
      previewData: {
        imageAnalysis: any;
        script: string;
        storyboard: any[];
        presenter?: any;
        discussions?: any[];
      };
      userConfirmed: boolean; // 必须为 true
    },
    @Headers() headers: Record<string, string>
  ) {
    console.log('[ExpertPipelineController] 收到确认生成请求');
    console.log('  用户确认:', body.userConfirmed);

    try {
      // 验证用户确认
      if (!body.userConfirmed) {
        return {
          code: 400,
          msg: '请确认后再生成视频',
          data: null
        };
      }

      // 验证预览数据
      if (!body.previewData || !body.previewData.script) {
        return {
          code: 400,
          msg: '缺少预览数据，请先调用预览接口',
          data: null
        };
      }

      // 构建完整的预览数据（兼容旧数据）
      const fullPreviewData = {
        imageAnalysis: body.previewData.imageAnalysis,
        script: body.previewData.script,
        storyboard: body.previewData.storyboard,
        presenter: body.previewData.presenter || {
          name: '小美',
          age: '22-26',
          appearance: '甜美可爱的亚洲女性',
          clothing: '休闲时尚',
          personality: '热情开朗',
          catchphrases: ['太棒了', '推荐'],
          signatureMoves: ['双手比心'],
          voiceStyle: '甜美活泼'
        },
        discussions: body.previewData.discussions || []
      };

      // 调用生成服务
      const result = await this.expertPipelineService.confirmAndGenerate(
        {
          imageUrls: body.images,
          extraInfo: body.extraInfo
        },
        fullPreviewData
      );

      return {
        code: 200,
        msg: '视频生成成功',
        data: {
          videoUrl: result.videoUrl,
          script: result.script,
          storyboard: result.storyboard,
          imageAnalysis: result.imageAnalysis,
          duration: result.duration
        }
      };
    } catch (error) {
      console.error('[ExpertPipelineController] 生成失败:', error);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null
      };
    }
  }

  /**
   * 一键生成（跳过预览，直接生成）
   * 注意：此接口会直接生成视频，请确保用户已明确同意
   */
  @Post('generate')
  async generateDirectly(
    @Body() body: { images: string[]; extraInfo?: string },
    @Headers() headers: Record<string, string>
  ) {
    console.log('[ExpertPipelineController] 收到直接生成请求');

    try {
      // 验证输入
      if (!body.images || body.images.length < 3) {
        return {
          code: 400,
          msg: '请上传至少3张图片',
          data: null
        };
      }

      // 先预览
      const previewResult = await this.expertPipelineService.previewGeneration({
        imageUrls: body.images,
        extraInfo: body.extraInfo
      });

      // 再生成
      const result = await this.expertPipelineService.confirmAndGenerate(
        {
          imageUrls: body.images,
          extraInfo: body.extraInfo
        },
        previewResult
      );

      return {
        code: 200,
        msg: '视频生成成功',
        data: {
          videoUrl: result.videoUrl,
          script: result.script,
          storyboard: result.storyboard,
          imageAnalysis: result.imageAnalysis,
          duration: result.duration
        }
      };
    } catch (error) {
      console.error('[ExpertPipelineController] 生成失败:', error);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null
      };
    }
  }

  /**
   * 健康检查
   */
  @Get('health')
  health() {
    return {
      code: 200,
      msg: 'Expert Pipeline Service is running',
      data: {
        service: 'expert-pipeline',
        status: 'healthy',
        models: {
          imageAnalysis: 'doubao-seed-2-0-pro-260215',
          copywriting: 'doubao-seed-2-0-pro-260215',
          storyboard: 'doubao-seed-2-0-lite-260215',
          videoGeneration: 'doubao-seedance-1-5-pro-251215'
        },
        features: {
          previewMode: true,
          confirmationRequired: true,
          duration: '12 seconds',
          presenter: 'Beautiful Asian female presenter'
        }
      }
    };
  }
}
