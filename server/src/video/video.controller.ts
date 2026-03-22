import { Controller, Post, Body, Req, Get, Param, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { VideoService } from './video.service';
import { VideoQueueService } from './video-queue.service';
import { VIPService } from '../vip/vip.service';
import { DatabaseService } from '../database/database.service';
import { ZhipuService } from '../zhipu/zhipu.service';

@Controller('video')
export class VideoController {
  constructor(
    private readonly videoService: VideoService,
    private readonly queueService: VideoQueueService,
    private readonly vipService: VIPService,
    private readonly databaseService: DatabaseService,
    @Inject(forwardRef(() => ZhipuService))
    private readonly zhipuService: ZhipuService
  ) {}

  /**
   * 测试 API Key 配置
   */
  @Get('config-check')
  async checkConfig() {
    // 从环境变量读取配置
    let apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY || process.env.COZE_API_KEY;
    let baseUrl = process.env.COZE_INTEGRATION_BASE_URL;
    let modelBaseUrl = process.env.COZE_INTEGRATION_MODEL_BASE_URL;

    // 如果环境变量为空或格式不正确，尝试从文件读取
    if (!apiKey || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(apiKey)) {
      try {
        const fs = require('fs');
        const path = require('path');
        const envFile = fs.readFileSync(path.join(process.cwd(), '..', '.env.local'), 'utf-8');

        const apiKeyMatch = envFile.match(/COZE_WORKLOAD_IDENTITY_API_KEY=(.+)/);
        if (apiKeyMatch && apiKeyMatch[1]) {
          apiKey = apiKeyMatch[1].trim();
        }

        const baseUrlMatch = envFile.match(/COZE_INTEGRATION_BASE_URL=(.+)/);
        if (baseUrlMatch && baseUrlMatch[1]) {
          baseUrl = baseUrlMatch[1].trim();
        }

        const modelBaseUrlMatch = envFile.match(/COZE_INTEGRATION_MODEL_BASE_URL=(.+)/);
        if (modelBaseUrlMatch && modelBaseUrlMatch[1]) {
          modelBaseUrl = modelBaseUrlMatch[1].trim();
        }
      } catch (error) {
        console.error('读取 .env.local 文件失败:', error);
      }
    }

    return {
      code: 200,
      msg: 'success',
      data: {
        hasApiKey: !!apiKey,
        apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : 'none',
        baseUrl: baseUrl || 'default',
        modelBaseUrl: modelBaseUrl || 'default',
        environment: process.env.NODE_ENV || 'development',
        envVars: {
          hasWorkloadApiKey: !!process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
          hasSimpleApiKey: !!process.env.COZE_API_KEY,
          hasBaseUrl: !!baseUrl,
          hasModelBaseUrl: !!modelBaseUrl,
          rawWorkloadApiKey: process.env.COZE_WORKLOAD_IDENTITY_API_KEY,
          rawBaseUrl: process.env.COZE_INTEGRATION_BASE_URL,
          rawModelBaseUrl: process.env.COZE_INTEGRATION_MODEL_BASE_URL
        }
      }
    };
  }

  @Post('generate')
  async generateVideo(@Req() req: Request) {
    console.log('收到视频生成请求，完整 req.body:', JSON.stringify(req.body));
    console.log('Content-Type:', req.headers['content-type']);

    // 防御性处理：确保 req.body 存在
    const body = req.body || {};
    const images = body.images || [];

    console.log('收到视频生成请求，图片数量:', images.length);
    console.log('图片URL列表:', images);

    if (!images || images.length === 0) {
      return {
        code: 400,
        msg: '请至少上传1张图片',
        data: null
      };
    }

    try {
      // 检查用户配额
      if (body.openid) {
        const hasQuota = await this.vipService.checkUserQuota(body.openid);
        if (!hasQuota) {
          return {
            code: 403,
            msg: '今日免费次数已用完，请购买套餐',
            data: null
          };
        }
      }

      // 提取请求头并传递给service
      // 提取功能配置
      const features = body.features || {};
      console.log('功能配置:', features);
      
      // 步骤1: 尝试分析图片和生成文案，如果失败则使用默认文案
      let copywriting = '欢迎来到宇轩百货！这里有最棒的商品，最优惠的价格。快来看看吧，一定不会让你失望！';
      let storeName = '宇轩百货';
      
      try {
        const imageAnalysis = await this.videoService.analyzeImagesWithProgress(images);
        copywriting = await this.videoService.generateCopywritingWithProgress(imageAnalysis);
        storeName = imageAnalysis?.shopName || '宇轩百货';
        console.log('文案生成完成:', copywriting);
      } catch (analyzeError: any) {
        console.warn('图片分析失败，使用默认文案:', analyzeError.message);
      }

      // 步骤2: 使用ZhipuService生成美女主播口播视频
      console.log('开始生成美女主播口播视频...');
      const videoUrl = await this.zhipuService.generate30SecondVideo(images, copywriting);
      console.log('视频生成完成:', videoUrl);

      const result = {
        videoUrl,
        copywriting,
        storeName,
        imageUrls: images
      };
      console.log('准备返回响应:', {
        code: 200,
        msg: 'success',
        data: result
      });

      // 消耗用户配额
      if (body.openid && result) {
        await this.vipService.consumeQuota(body.openid);
      }

      // 保存到历史记录
      if (body.openid && result) {
        await this.databaseService.addUserVideoHistory({
          openid: body.openid,
          images: result.imageUrls || [],
          videoUrl: result.videoUrl,
          copywriting: result.copywriting,
          storeName: result.storeName,
          imageUrls: result.imageUrls || [],
        });
      }

      return {
        code: 200,
        msg: 'success',
        data: result
      };
    } catch (error) {
      console.error('视频生成失败:', error);
      return {
        code: 500,
        msg: error.message || '视频生成失败',
        data: null
      };
    }
  }

  /**
   * 创建异步视频生成任务
   */
  @Post('create-async-task')
  async createAsyncTask(@Req() req: Request, @Body() body: any) {
    console.log('[createAsyncTask] 收到请求');
    console.log('[createAsyncTask] 请求体:', JSON.stringify(body, null, 2));
    console.log('[createAsyncTask] 图片数组:', body.images);
    console.log('[createAsyncTask] 图片数量:', body.images?.length);
    console.log('[createAsyncTask] 请求头:', JSON.stringify(req.headers, null, 2));

    try {
      // 验证参数
      if (!body.images || !Array.isArray(body.images) || body.images.length === 0) {
        console.error('[createAsyncTask] 图片参数无效');
        return {
          code: 400,
          msg: '请上传至少1张图片',
          data: null
        };
      }

      // 创建任务并添加到队列
      const task = this.queueService.addTask(body.images, body.userId);

      // 提取功能配置
      const features = body.features || {};
      console.log('[createAsyncTask] 功能配置:', features);

      // 异步处理任务
      this.processAsyncTask(task.id, body.images, req.headers as Record<string, string>, features);

      return {
        code: 200,
        msg: 'success',
        data: {
          taskId: task.id,
          status: task.status,
          message: '任务已创建，正在排队处理'
        }
      };
    } catch (error) {
      console.error('创建异步任务失败:', error);
      return {
        code: 500,
        msg: error.message || '创建任务失败',
        data: null
      };
    }
  }

  /**
   * 获取任务状态
   */
  @Get('task/:taskId')
  async getTaskStatus(@Param('taskId') taskId: string) {
    try {
      const task = this.queueService.getTask(taskId);

      if (!task) {
        return {
          code: 404,
          msg: 'Task not found',
          data: null
        };
      }

      return {
        code: 200,
        msg: 'success',
        data: {
          taskId: task.id,
          status: task.status,
          progress: task.progress,
          step: task.step || '',
          analysis: task.analysis || null,
          result: task.result || null,
          error: task.error || null,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }
      };
    } catch (error) {
      console.error('获取任务状态失败:', error);
      return {
        code: 500,
        msg: error.message || '获取任务状态失败',
        data: null
      };
    }
  }

  /**
   * 获取用户的所有任务
   */
  @Get('tasks/:userId')
  async getUserTasks(@Param('userId') userId: string) {
    try {
      const tasks = this.queueService.getUserTasks(userId);

      return {
        code: 200,
        msg: 'success',
        data: tasks.map(task => ({
          taskId: task.id,
          status: task.status,
          progress: task.progress,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        }))
      };
    } catch (error) {
      console.error('获取用户任务失败:', error);
      return {
        code: 500,
        msg: error.message || '获取用户任务失败',
        data: null
      };
    }
  }

  /**
   * 获取队列状态
   */
  @Get('queue-status')
  async getQueueStatus() {
    try {
      const status = this.queueService.getQueueStatus();

      return {
        code: 200,
        msg: 'success',
        data: status
      };
    } catch (error) {
      console.error('获取队列状态失败:', error);
      return {
        code: 500,
        msg: error.message || '获取队列状态失败',
        data: null
      };
    }
  }

  /**
   * 异步处理任务（内部方法）
   */
  private async processAsyncTask(
    taskId: string,
    imageUrls: string[],
    headers: Record<string, string>,
    features?: {
      resolution?: '720p' | '1080p' | '4k';
      watermark?: boolean;
      audio?: boolean;
    }
  ): Promise<void> {
    try {
      console.log('[processAsyncTask] 功能配置:', features);
      
      // 更新任务状态：开始处理
      this.queueService.updateTask(taskId, {
        status: 'processing',
        progress: 10,
        step: '正在初始化...',
      });

      // 步骤1: AI图片分析（20-40%）
      this.queueService.updateTask(taskId, {
        progress: 20,
        step: 'AI正在分析图片中的产品...',
      });

      const analysisResult = await this.videoService.analyzeImagesWithProgress(imageUrls);

      // 更新AI分析结果
      this.queueService.updateTask(taskId, {
        progress: 40,
        step: `识别到${analysisResult.products?.length || 0}个产品，正在生成营销文案...`,
        analysis: analysisResult,
      });

      // 步骤2: 生成营销文案（40-60%）
      this.queueService.updateTask(taskId, {
        progress: 50,
        step: 'AI正在为每个产品生成专属文案...',
      });

      const copywriting = await this.videoService.generateCopywritingWithProgress(analysisResult);

      this.queueService.updateTask(taskId, {
        progress: 60,
        step: '文案生成完成，开始生成视频...',
      });

      // 步骤3: FFmpeg视频生成（60-90%）
      this.queueService.updateTask(taskId, {
        progress: 70,
        step: '正在生成带字幕的专业视频...',
      });

      const videoUrl = await this.videoService.generateCompleteVideoPublic(imageUrls, copywriting, features);

      this.queueService.updateTask(taskId, {
        progress: 90,
        step: '视频生成完成，正在上传...',
      });

      // 完成任务
      this.queueService.updateTask(taskId, {
        status: 'completed',
        progress: 100,
        step: '视频生成完成！',
        result: {
          videoUrl,
          copywriting,
          storeName: analysisResult.shopName || '未知店铺',
        },
      });

      // 标记任务处理完成
      this.queueService.completeTask(taskId);

      console.log(`异步任务处理完成: ${taskId}`);
    } catch (error) {
      console.error(`异步任务处理失败: ${taskId}`, error);

      // 更新任务状态为失败
      this.queueService.updateTask(taskId, {
        status: 'failed',
        error: error.message || '视频生成失败',
      });

      // 标记任务处理完成
      this.queueService.completeTask(taskId);
    }
  }
}
