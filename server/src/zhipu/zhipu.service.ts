import { Injectable } from '@nestjs/common';
import { VideoGenerationClient, Config, S3Storage } from 'coze-coding-dev-sdk';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ZhipuService {
  private videoClient: VideoGenerationClient;
  private storage: S3Storage;

  constructor() {
    // 使用豆包视频生成SDK
    const config = new Config();
    this.videoClient = new VideoGenerationClient(config);
    console.log('[VideoService] 豆包视频生成客户端初始化完成');

    // 初始化S3存储
    this.storage = new S3Storage({
      endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
      accessKey: '',
      secretKey: '',
      bucketName: process.env.COZE_BUCKET_NAME,
      region: 'cn-beijing',
    });
    console.log('[VideoService] S3存储客户端初始化完成');
  }

  /**
   * 生成视频（豆包 doubao-seedance-1-5-pro-251215）
   * 支持最长12秒视频，SDK自动轮询等待结果
   */
  async generateVideo(prompt: string, options?: {
    duration?: number;
    ratio?: '16:9' | '9:16' | '1:1';
    firstFrameUrl?: string;
    returnLastFrame?: boolean;
  }): Promise<{ videoUrl: string; lastFrameUrl?: string }> {
    const duration = options?.duration || 12;
    const ratio = options?.ratio || '9:16';
    const returnLastFrame = options?.returnLastFrame || false;

    console.log(`[VideoService] 开始生成视频, 时长: ${duration}秒, 比例: ${ratio}`);
    console.log(`[VideoService] Prompt: ${prompt.substring(0, 100)}...`);

    // 构建内容数组
    const content: any[] = [];
    
    // 如果有首帧图片
    if (options?.firstFrameUrl) {
      content.unshift({
        type: 'image_url',
        image_url: { url: options.firstFrameUrl },
        role: 'first_frame',
      });
    }
    
    // 添加文本提示
    content.push({ type: 'text', text: prompt });

    try {
      const response = await this.videoClient.videoGeneration(content, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: duration,
        ratio: ratio,
        resolution: '720p',
        generateAudio: true,
        returnLastFrame: returnLastFrame,
        maxWaitTime: 600,
      });

      if (!response.videoUrl) {
        throw new Error('视频生成失败：未返回视频URL');
      }

      console.log(`[VideoService] 视频生成完成: ${response.videoUrl}`);
      
      return {
        videoUrl: response.videoUrl,
        lastFrameUrl: response.lastFrameUrl || undefined,
      };
    } catch (error: any) {
      console.error('[VideoService] 视频生成出错:', error.message);
      throw new Error(`视频生成失败: ${error.message}`);
    }
  }

  /**
   * 生成12秒电影级探店视频
   * 美女主播全程露脸口播，电影级品质
   */
  async generate30SecondVideo(
    imageUrls: string[],
    script: string,
  ): Promise<string> {
    console.log('[VideoService] 开始生成12秒电影级探店视频');
    console.log('[VideoService] 图片数量:', imageUrls.length);
    console.log('[VideoService] 文案长度:', script.length);

    // 过滤有效图片URL
    const validImageUrls = imageUrls.filter(url => url && url.startsWith('http'));
    console.log('[VideoService] 有效图片数量:', validImageUrls.length);

    // 构建电影级视频生成Prompt
    const prompt = this.buildMovieGradePrompt(script);
    
    try {
      // 使用首帧图片生成视频
      if (validImageUrls.length > 0) {
        console.log('[VideoService] 使用首帧图片生成电影级视频...');
        const result = await this.generateVideo(prompt, {
          duration: 12,
          ratio: '9:16',
          firstFrameUrl: validImageUrls[0],
          returnLastFrame: false,
        });
        console.log(`[VideoService] 电影级视频生成完成: ${result.videoUrl}`);
        return result.videoUrl;
      }
      
      // 没有图片则直接生成
      console.log('[VideoService] 无首帧图片，直接生成电影级视频...');
      const result = await this.generateVideo(prompt, {
        duration: 12,
        ratio: '9:16',
        returnLastFrame: false,
      });
      console.log(`[VideoService] 电影级视频生成完成: ${result.videoUrl}`);
      return result.videoUrl;
      
    } catch (error: any) {
      console.error('[VideoService] 视频生成失败:', error.message);
      
      // 如果使用首帧图片失败，尝试不使用首帧图片再次生成
      console.log('[VideoService] 尝试不使用首帧图片重新生成...');
      try {
        const result = await this.generateVideo(prompt, {
          duration: 12,
          ratio: '9:16',
          returnLastFrame: false,
        });
        console.log(`[VideoService] 重试成功: ${result.videoUrl}`);
        return result.videoUrl;
      } catch (retryError: any) {
        console.error('[VideoService] 重试也失败:', retryError.message);
        throw new Error(`视频生成失败，请稍后重试`);
      }
    }
  }

  /**
   * 构建12秒电影级视频生成Prompt
   * 包含所有必要要求：美女主播、露脸口播、电影级品质
   */
  private buildMovieGradePrompt(script: string): string {
    return `Professional 12-second shop exploration video with beautiful female presenter. Movie-grade quality.

REQUIRED CHARACTER:
- A beautiful Asian female presenter (ages 20-30) MUST appear in the video
- She MUST be visible and facing the camera while speaking
- Professional, enthusiastic, trustworthy appearance
- She should stand or walk through the shop, pointing at key elements

Video Structure (12 seconds total, synchronized with music beats):
- Scene 1 (0-3s): Beautiful presenter standing in front of shop entrance, introducing the shop (music intro)
- Scene 2 (3-6s): Presenter walking into the shop, showing store layout and atmosphere (music buildup)
- Scene 3 (6-9s): Presenter highlighting key products on display (music climax)
- Scene 4 (9-12s): Presenter at the shop exit or counter, final call-to-action (music resolution)

Visual Excellence:
- Beautiful female presenter MUST be clearly visible throughout the video
- Presenter should interact with shop elements (pointing at products, touching items)
- Cinematic camera: smooth zoom, steady pan, professional dolly shots
- Color strategy: high contrast, vibrant colors, professional color grading
- Perfect lighting on presenter's face, natural colors, 720p clarity
- Seamless transitions, no cuts
- 9:16 aspect ratio for mobile

Audio Requirements:
- Voice: "${script.substring(0, 150)}${script.length > 150 ? '...' : ''}" (spoken by the beautiful female presenter, clear and energetic)
- Background Music: High-energy, royalty-free, viral-style beats synchronized with video
- Sound Effects: Bass drops and impact beats synchronized with video transitions
- Pro Mixing: Voice (70%) + Background Music (25%) + Sound Effects (5%)

Quality:
- High-energy, trustworthy, authentic, cinematic
- Dynamic pacing, perfect timing, explosive visual impact
- Real shop environment, realistic with professional polish
- Beautiful female presenter MUST appear in ALL scenes, facing camera while speaking
- Maximum visual impact: dynamic camera movements, neon colors, professional presenter
- Movie-grade quality, 12-second perfection`;
  }

  /**
   * 简单测试视频生成
   */
  async testGenerate(): Promise<{ success: boolean; message: string; videoUrl?: string }> {
    try {
      const result = await this.generateVideo('A beautiful female Asian presenter in a shop, professional video quality', {
        duration: 5,
        ratio: '9:16',
      });

      return {
        success: true,
        message: '视频生成测试成功',
        videoUrl: result.videoUrl,
      };
    } catch (error: any) {
      return {
        success: false,
        message: `视频生成测试失败: ${error.message}`,
      };
    }
  }
}
