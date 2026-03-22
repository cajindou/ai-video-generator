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
    const duration = options?.duration || 10;
    const ratio = options?.ratio || '9:16'; // 竖屏适合小程序
    const returnLastFrame = options?.returnLastFrame || false;

    console.log(`[VideoService] 开始生成视频, 时长: ${duration}秒, 比例: ${ratio}`);
    console.log(`[VideoService] Prompt: ${prompt.substring(0, 100)}...`);

    // 构建内容数组
    const content: any[] = [{ type: 'text', text: prompt }];
    
    // 如果有首帧图片
    if (options?.firstFrameUrl) {
      content.unshift({
        type: 'image_url',
        image_url: { url: options.firstFrameUrl },
        role: 'first_frame',
      });
    }

    try {
      const response = await this.videoClient.videoGeneration(content, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: duration,
        ratio: ratio,
        resolution: '720p',
        generateAudio: true, // 自动生成音频（语音、音效、背景音乐）
        returnLastFrame: returnLastFrame,
        maxWaitTime: 600, // 最长等待10分钟
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
   * 生成30秒视频（3段10秒拼接）
   * 使用豆包SDK，每段最长10秒，支持音频自动生成
   */
  async generate30SecondVideo(
    imageUrls: string[],
    script: string,
  ): Promise<string> {
    console.log('[VideoService] 开始生成30秒视频（3段拼接）');
    console.log('[VideoService] 图片数量:', imageUrls.length);
    console.log('[VideoService] 文案长度:', script.length);

    // 将文案分成3段
    const segments = this.splitScript(script, 3);
    const videoUrls: string[] = [];
    let lastFrameUrl: string | undefined;

    // 过滤有效图片URL
    const validImageUrls = imageUrls.filter(url => url && url.startsWith('http'));
    console.log('[VideoService] 有效图片数量:', validImageUrls.length);

    // 生成3段视频
    for (let i = 0; i < 3; i++) {
      console.log(`[VideoService] 生成第 ${i + 1}/3 段视频...`);
      
      const prompt = this.buildPrompt(segments[i], '', i);
      
      // 暂时不使用首帧图片（可能导致400错误）
      // 只在第二、三段使用上一段的最后一帧
      const firstFrame = lastFrameUrl;
      
      try {
        const result = await this.generateVideo(prompt, {
          duration: 10,
          ratio: '9:16',
          firstFrameUrl: firstFrame,
          returnLastFrame: i < 2,
        });
        
        videoUrls.push(result.videoUrl);
        lastFrameUrl = result.lastFrameUrl;
        
        console.log(`[VideoService] 第 ${i + 1} 段视频完成`);
      } catch (error: any) {
        console.error(`[VideoService] 第 ${i + 1} 段视频生成失败:`, error.message);
        // 如果某段失败，继续生成下一段
        throw error;
      }
    }

    // 下载并拼接视频
    console.log('[VideoService] 开始拼接3段视频...');
    const finalVideoUrl = await this.concatenateVideos(videoUrls);
    
    return finalVideoUrl;
  }

  /**
   * 构建视频生成Prompt
   * 生成美女主播口播视频的提示词
   */
  private buildPrompt(script: string, imageUrl: string, segmentIndex: number): string {
    const segmentDescriptions = [
      '开场介绍环节',
      '产品展示环节', 
      '结尾推荐环节',
    ];

    const prompt = `一位年轻漂亮的女性美食博主（20-30岁，亚洲面孔，精致妆容，职业主播形象）在店铺里进行探店直播。

场景：${segmentDescriptions[segmentIndex]}
口播内容："${script}"

动作要求：
- 主播全程面对镜头，表情自然亲切，微笑
- 手势生动自然，有互动感
- 语气热情，声音清晰
- 背景是温馨的店铺环境

画面要求：
- 竖屏拍摄，适合手机观看
- 画面明亮，色调温暖
- 专业拍摄质感
- 自然光线`;

    return prompt;
  }

  /**
   * 将文案分成多段
   */
  private splitScript(script: string, parts: number): string[] {
    // 按句号、感叹号、问号分割
    const sentences = script.split(/[。！？\n]+/).filter(s => s.trim());
    
    if (sentences.length === 0) {
      // 如果没有标点，按字符数平分
      const perPart = Math.ceil(script.length / parts);
      const result: string[] = [];
      for (let i = 0; i < parts; i++) {
        const start = i * perPart;
        const end = Math.min(start + perPart, script.length);
        if (start < script.length) {
          result.push(script.substring(start, end));
        }
      }
      while (result.length < parts) {
        result.push('');
      }
      return result;
    }

    const result: string[] = [];
    const perPart = Math.ceil(sentences.length / parts);
    
    for (let i = 0; i < parts; i++) {
      const start = i * perPart;
      const end = Math.min(start + perPart, sentences.length);
      const segment = sentences.slice(start, end).join('。');
      result.push(segment || '');
    }

    // 确保返回3段
    while (result.length < parts) {
      result.push('');
    }

    return result;
  }

  /**
   * 拼接多个视频
   */
  private async concatenateVideos(videoUrls: string[]): Promise<string> {
    if (videoUrls.length === 0) {
      throw new Error('没有视频需要拼接');
    }

    if (videoUrls.length === 1) {
      return videoUrls[0];
    }

    console.log('[VideoService] 开始下载并拼接视频...');

    // 创建临时目录
    const tmpDir = '/tmp/video-concat';
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const localFiles: string[] = [];

    // 下载所有视频
    for (let i = 0; i < videoUrls.length; i++) {
      const videoUrl = videoUrls[i];
      const localPath = path.join(tmpDir, `segment_${i}.mp4`);
      
      console.log(`[VideoService] 下载视频 ${i + 1}/${videoUrls.length}: ${videoUrl}`);
      
      const response = await axios.get(videoUrl, { responseType: 'arraybuffer' });
      fs.writeFileSync(localPath, response.data);
      localFiles.push(localPath);
    }

    // 使用FFmpeg拼接视频
    const listFile = path.join(tmpDir, 'filelist.txt');
    const fileListContent = localFiles.map(f => `file '${f}'`).join('\n');
    fs.writeFileSync(listFile, fileListContent);

    const outputFile = path.join(tmpDir, `output_${Date.now()}.mp4`);
    
    // FFmpeg拼接命令
    const { execSync } = require('child_process');
    const ffmpegCmd = `ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${outputFile}`;
    
    console.log('[VideoService] 执行FFmpeg拼接...');
    execSync(ffmpegCmd, { stdio: 'inherit' });

    // 上传拼接后的视频到S3
    console.log('[VideoService] 上传拼接后的视频...');
    
    const videoBuffer = fs.readFileSync(outputFile);
    const s3Key = await this.storage.uploadFile({
      fileContent: videoBuffer,
      fileName: `videos/concatenated_${Date.now()}.mp4`,
      contentType: 'video/mp4',
    });
    
    // 生成签名URL（7天有效期）
    const videoUrl = await this.storage.generatePresignedUrl({
      key: s3Key,
      expireTime: 7 * 24 * 60 * 60, // 7天
    });
    
    console.log('[VideoService] 视频上传完成:', videoUrl);
    
    // 清理临时文件
    for (const file of localFiles) {
      try { fs.unlinkSync(file); } catch {}
    }
    try { fs.unlinkSync(listFile); } catch {}
    try { fs.unlinkSync(outputFile); } catch {}

    return videoUrl;
  }

  /**
   * 简单测试视频生成
   */
  async testGenerate(): Promise<{ success: boolean; message: string; videoUrl?: string }> {
    try {
      const result = await this.generateVideo('一位年轻漂亮的女性美食博主在餐厅里热情介绍菜品，面对镜头微笑着说话', {
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
