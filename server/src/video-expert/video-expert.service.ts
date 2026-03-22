import { Injectable } from '@nestjs/common';
import { LLMClient, Config, VideoGenerationClient, TTSClient } from 'coze-coding-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface ImageAnalysis {
  mainSubject: string;
  environment: string;
  atmosphere: string;
  sellingPoints: string[];
  details: string[];
  colorMood: string;
  targetAudience: string;
}

export interface Storyboard {
  id: number;
  imageIndex: number;
  narration: string;
  sceneDescription: string;
  duration: number;
  transition: string;
  cameraMovement: string;
}

@Injectable()
export class VideoExpertService {
  private llmClient: LLMClient;
  private videoClient: VideoGenerationClient;
  private ttsClient: TTSClient;

  constructor() {
    const config = new Config();
    this.llmClient = new LLMClient(config);
    this.videoClient = new VideoGenerationClient(config);
    this.ttsClient = new TTSClient(config);
  }

  /**
   * 完整的AI视频生产流水线
   * 上传3-5张图片 -> 生成专业探店视频
   */
  async generatePromoVideo(
    imageUrls: string[],
    extraInfo?: string,
  ): Promise<{ videoUrl: string; storyboard: Storyboard[]; script: string }> {
    console.log('🎬 开始AI视频生产流水线...');
    console.log(`📷 输入图片: ${imageUrls.length}张`);
    console.log(`📝 额外信息: ${extraInfo || '无'}`);

    // ===== 步骤1: 顶级图片分析专家 =====
    console.log('\n📊 【图片分析专家】正在深度分析图片...');
    const imageAnalyses = await this.analyzeImages(imageUrls);

    // ===== 步骤2: 顶级文案专家 =====
    console.log('\n✍️ 【文案专家】正在生成销冠风格文案...');
    const script = await this.generateSalesScript(imageAnalyses, extraInfo);

    // ===== 步骤3: 顶级分镜专家 =====
    console.log('\n🎬 【分镜专家】正在制作分镜脚本...');
    const storyboard = await this.generateStoryboard(script, imageAnalyses, imageUrls.length);

    // ===== 步骤4: 顶级视频生成专家（含美女口播） =====
    console.log('\n🎥 【视频生成专家】正在生成专业探店视频...');
    const videoUrl = await this.generateVideoWithPresenter(imageUrls, script, storyboard);

    console.log('\n✅ 视频生成完成!');
    return {
      videoUrl,
      storyboard,
      script,
    };
  }

  /**
   * 顶级图片分析专家
   * 细致入微地分析每一张图片
   */
  private async analyzeImages(imageUrls: string[]): Promise<ImageAnalysis[]> {
    const analyses: ImageAnalysis[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`  分析图片 ${i + 1}/${imageUrls.length}...`);

      const messages = [
        {
          role: 'system' as const,
          content: `你是顶级的图片分析专家，专门为探店视频分析商品图片。
你需要细致入微地分析图片的每一个细节，包括：
1. 主体识别：产品是什么，有什么特点
2. 环境分析：拍摄场景、背景、氛围
3. 卖点提炼：最能吸引消费者的3-5个卖点
4. 细节描述：颜色、材质、光影、构图等视觉细节
5. 情感基调：图片传达的情绪和氛围
6. 目标人群：谁会被这个产品吸引

请用JSON格式输出分析结果。`,
        },
        {
          role: 'user' as const,
          content: [
            { type: 'text' as const, text: '请深度分析这张探店图片，提取所有有助于视频创作的信息：' },
            { type: 'image_url' as const, image_url: { url: imageUrl, detail: 'high' as const } },
          ],
        },
      ];

      const response = await this.llmClient.invoke(messages, {
        model: 'doubao-seed-1-6-vision-250815',
        temperature: 0.3,
      });

      // 安全处理 response.content
      const content = (response as any)?.content || '';
      console.log(`  LLM返回内容类型: ${typeof content}, 长度: ${content?.length || 0}`);

      try {
        const contentStr = String(content);
        const jsonMatch = contentStr.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analyses.push(JSON.parse(jsonMatch[0]));
        } else {
          analyses.push(this.parseAnalysisFromText(contentStr));
        }
      } catch (e) {
        console.error('  解析图片分析结果失败:', (e as Error).message);
        analyses.push(this.parseAnalysisFromText(String(content)));
      }
    }

    return analyses;
  }

  private parseAnalysisFromText(text: string): ImageAnalysis {
    const t = text || '';
    return {
      mainSubject: this.extractField(t, '主体', '产品') || '商品',
      environment: this.extractField(t, '环境', '场景') || '店铺环境',
      atmosphere: this.extractField(t, '氛围', '基调') || '温馨',
      sellingPoints: this.extractListField(t, '卖点') || ['品质优良', '性价比高'],
      details: this.extractListField(t, '细节') || ['细节丰富'],
      colorMood: this.extractField(t, '颜色', '色调') || '明亮',
      targetAudience: this.extractField(t, '目标', '人群') || '消费者',
    };
  }

  private extractField(text: string, ...keywords: string[]): string {
    for (const keyword of keywords) {
      const regex = new RegExp(`${keyword}[:：]\\s*([^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match) return match[1].trim();
    }
    return '';
  }

  private extractListField(text: string, keyword: string): string[] {
    const regex = new RegExp(`${keyword}[:：]\\s*([^\\n]+)`, 'i');
    const match = text.match(regex);
    if (match) {
      return match[1].split(/[,，、]/).map(s => s.trim()).filter(Boolean);
    }
    return [];
  }

  /**
   * 顶级文案专家
   * 生成自带流量的销冠风格文案
   */
  private async generateSalesScript(
    analyses: ImageAnalysis[],
    extraInfo?: string,
  ): Promise<string> {
    // 安全地处理 analyses
    const analysisSummary = analyses
      .map((a, i) => {
        const subject = a?.mainSubject || '商品';
        const points = (a?.sellingPoints || []).filter(Boolean).join(', ') || '品质优良';
        return `图片${i + 1}: ${subject}, 卖点: ${points}`;
      })
      .join('\n');

    const extraPrompt = extraInfo 
      ? `\n\n用户提供的额外信息（必须融入文案中）：${extraInfo}` 
      : '';

    const messages = [
      {
        role: 'system' as const,
        content: `你是顶级的探店文案专家，专门为商品撰写自带流量的带货文案。

你的文案特点：
1. **销冠风格**：像顶级销售一样，有说有笑，活灵活现
2. **带入感强**：让观众仿佛身临其境
3. **痛点共鸣**：直击消费者需求
4. **行动号召**：引导下单或到店

文案结构：
- 开场钩子（3秒）：用悬念或痛点吸引注意力
- 产品展示（每张图5秒）：展示卖点，讲故事
- 收尾转化（3秒）：促销信息，行动号召

字数要求：100-150字（适合15秒视频）
语气：活泼、专业、有感染力`,
      },
      {
        role: 'user' as const,
        content: `为以下产品撰写探店视频文案：

图片分析：
${analysisSummary}
${extraPrompt}

要求：
1. 每句话都要有感染力
2. 突出产品独特卖点
3. 加入互动感和故事感
4. 结尾要有行动号召`,
      },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'doubao-seed-2-0-pro-260215',
      temperature: 0.8,
    });

    return response.content;
  }

  /**
   * 顶级分镜专家
   */
  private async generateStoryboard(
    script: string,
    analyses: ImageAnalysis[],
    imageCount: number,
  ): Promise<Storyboard[]> {
    const messages = [
      {
        role: 'system' as const,
        content: `你是顶级的视频分镜专家，专门为探店视频制作分镜脚本。

你需要：
1. 将文案按图片数量拆分成对应片段
2. 每个片段指定：口播文案、画面描述、时长（3-5秒）、转场效果、镜头运动

输出JSON数组格式。`,
      },
      {
        role: 'user' as const,
        content: `请将以下文案拆分为${imageCount}个分镜：

文案：
${script}

总时长15秒左右。`,
      },
    ];

    const response = await this.llmClient.invoke(messages, {
      model: 'doubao-seed-2-0-lite-260215',
      temperature: 0.5,
    });

    try {
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('解析分镜失败:', e);
    }

    // 降级方案
    return this.createDefaultStoryboard(script, imageCount);
  }

  private createDefaultStoryboard(script: string, imageCount: number): Storyboard[] {
    const sentences = script.split(/[。！？\n]/).filter(Boolean);
    const storyboards: Storyboard[] = [];

    for (let i = 0; i < imageCount; i++) {
      storyboards.push({
        id: i,
        imageIndex: i,
        narration: sentences[i] || `来看这张图，产品细节真的很棒！`,
        sceneDescription: `展示产品第${i + 1}个角度`,
        duration: 3,
        transition: i === 0 ? '淡入' : '滑动',
        cameraMovement: i % 2 === 0 ? '推进' : '平移',
      });
    }

    return storyboards;
  }

  /**
   * 顶级视频生成专家（含美女口播）
   * 整合前面已有的视频生成逻辑
   */
  private async generateVideoWithPresenter(
    imageUrls: string[],
    script: string,
    storyboard: Storyboard[],
  ): Promise<string> {
    console.log('  将图片转换为Base64...');
    const base64Images = await this.imageUrlsToBase64(imageUrls);

    // 构建视频生成prompt - 包含美女口播要求
    const promptText = this.buildVideoPrompt(base64Images, script, storyboard);

    const contentItems: any[] = [];

    // 使用第一张图片作为首帧
    contentItems.push({
      type: 'image_url',
      image_url: { url: base64Images[0] },
      role: 'first_frame',
    });

    contentItems.push({
      type: 'text',
      text: promptText,
    });

    console.log('  调用视频生成API...');

    try {
      const response = await this.videoClient.videoGeneration(contentItems, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: 30,
        ratio: '9:16',
        resolution: '720p',
        generateAudio: true,
        watermark: false,
        maxWaitTime: 900,
      });

      if (response.videoUrl) {
        console.log('  视频生成成功:', response.videoUrl);
        return response.videoUrl;
      }

      throw new Error('视频生成未返回URL');
    } catch (error) {
      console.error('视频生成失败:', error);
      throw error;
    }
  }

  /**
   * 构建视频生成Prompt（含美女口播要求）
   */
  private buildVideoPrompt(
    base64Images: string[],
    script: string,
    storyboard: Storyboard[],
  ): string {
    let promptText = '';

    // 视觉参考
    promptText += `Visual References:\n`;
    promptText += `You have ${base64Images.length} reference images of a real shop. These images show the exact shop sign, core products, and store layout that MUST be perfectly reproduced in the generated video.\n\n`;

    // 强制一致性要求
    promptText += `CRITICAL CONSISTENCY REQUIREMENTS:\n`;
    promptText += `- Shop Sign: MUST appear in ALL scenes exactly as shown\n`;
    promptText += `- Core Products: Products MUST match reference images\n`;
    promptText += `- Store Layout: MUST be consistent with reference images\n`;
    promptText += `- No Invented Elements: Do NOT add elements that don't exist\n\n`;

    // 美女主播要求（全程露脸 + 互动）
    promptText += `PRESENTER REQUIREMENTS (CRITICAL):\n`;
    promptText += `- Beautiful female presenter (Asian, 20-30 years old)\n`;
    promptText += `- MUST appear in ALL scenes throughout the entire video\n`;
    promptText += `- Always facing the camera while speaking\n`;
    promptText += `- Interacts naturally with shop elements (points to menu, touches products)\n`;
    promptText += `- Natural gestures and facial expressions\n`;
    promptText += `- Energetic, professional, trustworthy demeanor\n`;
    promptText += `- Perfect lighting on presenter's face\n\n`;

    // 场景描述（12秒视频）
    promptText += `Scene Descriptions (12-second video):\n`;
    promptText += `Scene 1 (0-3s): Beautiful presenter at shop entrance, introduces shop with energy\n`;
    promptText += `Scene 2 (3-6s): Presenter walks inside, showcases interior layout\n`;
    promptText += `Scene 3 (6-9s): Presenter highlights core products with close-ups\n`;
    promptText += `Scene 4 (9-12s): Presenter at counter, final call-to-action\n\n`;

    // 画质和运镜
    promptText += `Visual Quality:\n`;
    promptText += `- 720p HD, 9:16 vertical format\n`;
    promptText += `- Dynamic camera: push-in, slow zoom, smooth tracking\n`;
    promptText += `- Professional color grading, vibrant colors\n`;
    promptText += `- Smooth transitions (fade, dissolve)\n`;
    promptText += `- Cinematic depth of field\n\n`;

    // 音频要求
    promptText += `Audio Requirements:\n`;
    promptText += `- Voice: "${script}" (spoken by the beautiful female presenter, clear and energetic)\n`;
    promptText += `- Background Music: High-energy, upbeat, royalty-free\n`;
    promptText += `- Sound Effects: Synchronized with transitions\n`;
    promptText += `- Mixing: Voice 70% + Music 25% + SFX 5%\n\n`;

    // 质量标准
    promptText += `Quality:\n`;
    promptText += `- High-energy, trustworthy, authentic, cinematic\n`;
    promptText += `- Beautiful female presenter MUST appear in ALL scenes\n`;
    promptText += `- Shop elements MUST remain consistent\n`;
    promptText += `- Movie-grade quality, 12-second perfection\n`;

    return promptText;
  }

  /**
   * 图片URL转Base64
   */
  private async imageUrlsToBase64(imageUrls: string[]): Promise<string[]> {
    const base64Images: string[] = [];

    for (const url of imageUrls) {
      // 本地路径
      if (url.startsWith('/api/uploads/') || url.startsWith('/uploads/')) {
        const filePath = url.replace('/api/uploads/', '/tmp/uploads/').replace('/uploads/', '/tmp/uploads/');
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          const ext = path.extname(filePath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          base64Images.push(`data:${mimeType};base64,${buffer.toString('base64')}`);
          continue;
        }
      }

      // HTTP URL
      if (url.startsWith('http')) {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const contentType = response.headers['content-type'] || 'image/jpeg';
        const base64 = Buffer.from(response.data).toString('base64');
        base64Images.push(`data:${contentType};base64,${base64}`);
        continue;
      }

      // 已经是Base64
      if (url.startsWith('data:')) {
        base64Images.push(url);
        continue;
      }

      console.warn(`无法处理的图片URL: ${url}`);
    }

    return base64Images;
  }
}
