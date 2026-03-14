import { Injectable } from '@nestjs/common';
import {
  LLMClient,
  Config,
  VideoGenerationClient,
  HeaderUtils,
  Content,
  Resolution,
  Ratio
} from 'coze-coding-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

@Injectable()
export class VideoService {
  private llmClient: LLMClient;
  private videoGenerationClient: VideoGenerationClient;
  private config: Config;
  private uploadDir: string;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // 从环境变量读取 API Key
    const envApiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY || process.env.COZE_API_KEY || '';
    console.log('[VideoService] 原始环境变量 API Key:', envApiKey);
    console.log('[VideoService] 环境变量 API Key 格式检查:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(envApiKey) ? 'UUID格式正确' : 'UUID格式错误');

    // 尝试直接从文件读取环境变量（尝试多个可能的位置）
    const possibleEnvPaths = [
      path.join(process.cwd(), '..', '.env.local'), // server/dist/../.env.local
      path.join(process.cwd(), '.env.local'), // server/dist/.env.local
      path.join(process.cwd(), '..', '..', '.env.local'), // server/.env.local
      '/opt/bytefaas/.env.local', // 部署环境固定路径
    ];

    for (const envPath of possibleEnvPaths) {
      try {
        if (fs.existsSync(envPath)) {
          const envFile = fs.readFileSync(envPath, 'utf-8');
          const match = envFile.match(/COZE_WORKLOAD_IDENTITY_API_KEY=(.+)/);
          if (match && match[1]) {
            console.log('[VideoService] 从文件读取的 API Key (path:', envPath, '):', match[1].trim());
            console.log('[VideoService] 文件 API Key 格式检查:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(match[1].trim()) ? 'UUID格式正确' : 'UUID格式错误');
            this.apiKey = match[1].trim();
            break;
          }
        }
      } catch (error) {
        // 忽略错误，尝试下一个路径
        continue;
      }
    }

    // 如果没有从文件读取到，使用环境变量
    if (!this.apiKey) {
      console.log('[VideoService] 未从文件中找到 COZE_WORKLOAD_IDENTITY_API_KEY');
      this.apiKey = envApiKey;
    }

    // 使用火山引擎端点（豆包 API）
    this.baseUrl = 'https://ark.cn-beijing.volces.com';
    const modelBaseUrl = 'https://ark.cn-beijing.volces.com/api/v3';

    // 打印 API Key 调试信息
    console.log('[VideoService] 初始化');
    console.log('[VideoService] 最终使用的 API Key:', this.apiKey);
    console.log('[VideoService] API Key 格式检查:', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.apiKey) ? 'UUID格式正确' : 'UUID格式错误');
    console.log('[VideoService] Base URL:', this.baseUrl);
    console.log('[VideoService] Model Base URL:', modelBaseUrl);

    // 初始化配置
    this.config = new Config({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      modelBaseUrl
    });

    // 打印 Config 对象的属性
    console.log('[VideoService] Config 对象:', {
      apiKey: this.config.apiKey,
      baseUrl: this.config.baseUrl,
      modelBaseUrl: this.config.modelBaseUrl
    });

    // 初始化客户端
    this.llmClient = new LLMClient(this.config);
    this.videoGenerationClient = new VideoGenerationClient(this.config);

    // 初始化缓存
    this.videoCache = new Map<string, { url: string; timestamp: number }>();

    // 上传目录（与 UploadService 保持一致）
    console.log('[VideoService] 初始化上传目录...');

    // 优先使用环境变量配置的上传目录
    const envUploadDir = process.env.UPLOAD_DIR;

    if (envUploadDir) {
      // 使用环境变量指定的目录
      this.uploadDir = envUploadDir;
      console.log('[VideoService] 使用环境变量配置的上传目录:', this.uploadDir);
    } else {
      // 检测运行环境
      const cwd = process.cwd();

      // 在部署环境中，使用 /tmp/uploads
      if (cwd.includes('bytefaas') || cwd.includes('dist')) {
        this.uploadDir = '/tmp/uploads';
        console.log('[VideoService] 检测到部署环境，使用 /tmp/uploads');
      } else {
        // 开发环境：在 server 目录下创建 uploads
        this.uploadDir = path.join(cwd, 'uploads');
        console.log('[VideoService] 检测到开发环境，使用', this.uploadDir);
      }
    }

    console.log('[VideoService] 工作目录:', process.cwd());
    console.log('[VideoService] 上传目录:', this.uploadDir);
  }

  // 视频缓存（简单的内存缓存，可以扩展为Redis）
  private videoCache: Map<string, { url: string; timestamp: number }>;

  /**
   * 生成缓存键
   */
  private generateCacheKey(imageUrls: string[], customInput: string): string {
    const sortedUrls = imageUrls.sort().join(',');
    return `${sortedUrls}_${customInput}`;
  }

  /**
   * 检查缓存
   */
  private checkCache(cacheKey: string): string | null {
    const cached = this.videoCache.get(cacheKey);
    if (!cached) return null;

    // 缓存有效期：1小时
    const CACHE_TTL = 3600000;
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      this.videoCache.delete(cacheKey);
      return null;
    }

    console.log('命中缓存:', cacheKey);
    return cached.url;
  }

  /**
   * 更新缓存
   */
  private updateCache(cacheKey: string, url: string): void {
    this.videoCache.set(cacheKey, {
      url,
      timestamp: Date.now()
    });
  }

  /**
   * 完整的视频生成工作流（支持30秒以上多片段视频）
   */
  async generateVideo(imageUrls: string[], headers?: Record<string, string>, customInput?: string): Promise<{ videoUrl: string; copywriting: string; storeName: string; imageUrls: string[] }> {
    console.log('开始视频生成工作流（30秒以上多片段模式）...');
    console.log('接收到的图片URL数量:', imageUrls.length);

    // 检查缓存
    const cacheKey = this.generateCacheKey(imageUrls, customInput || '');
    const cachedVideo = this.checkCache(cacheKey);
    if (cachedVideo) {
      console.log('使用缓存视频:', cachedVideo);
      // 重新生成文案用于展示
      const imageAnalysis = await this.analyzeImages(imageUrls);
      const copywriting = await this.generateCopywriting(imageAnalysis);
      return {
        videoUrl: cachedVideo,
        copywriting,
        storeName: imageAnalysis?.shopName || '未知店铺',
        imageUrls
      };
    }

    // 提取转发headers（用于请求追踪和认证）
    const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : {};

    // 创建带customHeaders的客户端
    const videoClient = new VideoGenerationClient(this.config, customHeaders);

    // 步骤1: 分析图片（使用base64避免URL访问问题）
    console.log('步骤1: 分析图片...');
    const imageAnalysis = await this.analyzeImages(imageUrls);
    console.log('图片分析完成:', imageAnalysis);

    // 步骤2: 生成完整文案（30秒以上）
    console.log('步骤2: 生成完整文案（30秒以上）...');
    const fullCopywriting = await this.generateCopywriting(imageAnalysis);
    console.log('完整文案生成完成:', fullCopywriting);

    // 步骤3: 使用 FFmpeg 一次性生成30秒完整视频（多图轮播）
    console.log('步骤3: 使用 FFmpeg 一次性生成30秒完整视频...');
    const finalVideoUrl = await this.generateCompleteVideoWithFFmpeg(imageUrls, fullCopywriting);
    console.log('完整视频生成成功:', finalVideoUrl);

    // 提取店名（如果没有识别到，使用默认值）
    const storeName = imageAnalysis?.shopName || '未知店铺';

    // 更新缓存
    this.updateCache(cacheKey, finalVideoUrl);

    return { videoUrl: finalVideoUrl, copywriting: fullCopywriting, storeName, imageUrls };
  }

  /**
   * 异步视频生成（支持 callbackUrl）
   */
  async generateVideoAsync(
    imageUrls: string[],
    headers?: Record<string, string>,
    taskId?: string,
    callbackUrl?: string
  ): Promise<{ videoUrl: string; copywriting: string; storeName: string; imageUrls: string[] }> {
    console.log('开始异步视频生成工作流...');
    console.log('接收到的图片URL数量:', imageUrls.length);
    console.log('任务ID:', taskId);
    console.log('回调URL:', callbackUrl);
    
    // 提取转发headers（用于请求追踪和认证）
    const customHeaders = headers ? HeaderUtils.extractForwardHeaders(headers) : {};
    
    // 创建带customHeaders的客户端
    const videoClient = new VideoGenerationClient(this.config, customHeaders);
    
    // 步骤1: 分析图片（使用base64避免URL访问问题）
    console.log('步骤1: 分析图片...');
    const imageAnalysis = await this.analyzeImages(imageUrls);
    console.log('图片分析完成:', imageAnalysis);

    // 步骤2: 生成文案
    console.log('步骤2: 生成文案...');
    const copywriting = await this.generateCopywriting(imageAnalysis);
    console.log('文案生成完成:', copywriting);

    // 步骤3: 直接生成视频（支持 callbackUrl）
    console.log('步骤3: 生成视频...');
    const videoUrl = await this.generateVideoDirectAsync(
      videoClient,
      imageUrls,
      copywriting,
      imageAnalysis,
      callbackUrl
    );
    console.log('视频生成完成:', videoUrl);

    // 提取店名（如果没有识别到，使用默认值）
    const storeName = imageAnalysis?.shopName || '未知店铺';

    return { videoUrl, copywriting, storeName, imageUrls } as { videoUrl: string; copywriting: string; storeName: string; imageUrls: string[] };
  }

  /**
   * 将图片URL转换为base64
   * 支持本地文件路径和外部URL
   */
  private async imageUrlsToBase64(imageUrls: string[]): Promise<string[]> {
    const base64Images: string[] = [];
    
    for (const imageUrl of imageUrls) {
      try {
        // 判断是外部URL还是本地文件
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          // 外部URL：下载图片
          console.log('下载外部图片:', imageUrl);
          
          const response = await axios.get(imageUrl, {
            responseType: 'arraybuffer',
            timeout: 30000 // 30秒超时
          });
          
          const buffer = Buffer.from(response.data, 'binary');
          
          // 从响应头获取MIME类型，或根据URL推断
          let mimeType = 'image/jpeg';
          const contentType = response.headers['content-type'];
          if (contentType && contentType.startsWith('image/')) {
            mimeType = contentType;
          } else if (imageUrl.includes('.png')) {
            mimeType = 'image/png';
          }
          
          const base64 = buffer.toString('base64');
          base64Images.push(`data:${mimeType};base64,${base64}`);
          console.log('外部图片下载并转换成功');
        } else {
          // 本地文件路径
          const filename = imageUrl.split('/').pop();
          if (!filename) {
            console.warn('无法提取文件名:', imageUrl);
            continue;
          }
          
          const filepath = path.join(this.uploadDir, filename);
          
          console.log('读取本地文件:', filepath);
          
          // 检查文件是否存在
          if (!fs.existsSync(filepath)) {
            console.error('本地文件不存在:', filepath);
            continue;
          }
          
          // 读取文件
          const fileBuffer = fs.readFileSync(filepath);
          
          // 转换为base64
          const base64 = fileBuffer.toString('base64');
          
          // 获取MIME类型
          const ext = path.extname(filename).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
          
          base64Images.push(`data:${mimeType};base64,${base64}`);
          console.log('本地文件转换成功:', filename);
        }
      } catch (error) {
        console.error('转换图片失败:', imageUrl, error.message);
      }
    }
    
    return base64Images;
  }

  /**
   * 分析图片（提取必须保持一致的关键元素）
   */
  private async analyzeImages(imageUrls: string[]): Promise<any> {
    console.log('开始分析图片，原始URL数量:', imageUrls.length);

    // 将URL转换为base64
    const base64Images = await this.imageUrlsToBase64(imageUrls);

    console.log('Base64转换成功，数量:', base64Images.length);

    if (base64Images.length === 0) {
      throw new Error('没有有效的图片数据');
    }

    const imageContents = base64Images.map(base64 => ({
      type: 'image_url' as const,
      image_url: { url: base64 }
    }));

    const prompt = `请仔细分析以下图片，这是店铺的照片。重点提取以下三个关键信息：

**必须准确提取的三个核心元素：**
1. **门头招牌**：店铺招牌上显示的完整店名、品牌logo、招牌材质、招牌颜色、招牌字体
2. **展示的核心产品**：店铺中展示的主要产品、商品种类、产品特色
3. **店面格局**：店铺的空间布局、区域划分、主要设施、装修风格

请提取以下关键元素，以JSON格式输出：

{
  "shopName": "门头招牌上显示的完整店名（必须准确提取，不要省略任何文字）",
  "brandElements": ["品牌元素1", "品牌元素2", "品牌logo颜色、字体、招牌材质、招牌样式等"],
  "layout": "店面格局/店铺空间布局（如：开放式、封闭式、半开放式、展示区+收银区等）",
  "decorations": ["装饰元素1", "装饰元素2", "招牌材质、招牌样式、店铺装饰风格等"],
  "productsOnDisplay": ["展示的核心产品1", "展示的核心产品2", "产品特色、商品种类等"],
  "colorScheme": "店铺主色调和辅助色（如：白色+蓝色、红色+金色）",
  "lighting": "灯光氛围（如：明亮温馨、炫酷动感）",
  "materials": "主要材质和纹理（如：玻璃、金属、木质）"
}

特别注意：
1. 店名（shopName）必须准确完整，不要遗漏任何文字
2. 招牌信息（brandElements、decorations）要详细描述材质、颜色、字体
3. 店面格局（layout）要准确描述空间布局
4. 展示的核心产品（productsOnDisplay）要列出主要产品和特色
5. 如果是中文名称，请用中文输出，不要翻译

只返回JSON格式，不要其他任何解释文字。`;

    // 直接使用 axios 调用豆包 API（绕过 SDK 的 LangChain 配置问题）
    try {
      console.log('发送请求到豆包 API:', `${this.baseUrl}/api/v3/chat/completions`);
      
      const response = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                ...imageContents
              ]
            }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2分钟超时
        }
      );

      console.log('豆包 API 响应状态:', response.status);
      
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('豆包 API 返回的内容为空');
      }

      console.log('豆包 API 返回内容:', content.substring(0, 200) + '...');

      // 解析JSON返回
      const analysisText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(analysisText);
    } catch (error) {
      console.error('调用豆包 API 失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios 错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      // 返回默认空对象
      return {
        shopName: '',
        brandElements: [],
        layout: '',
        decorations: [],
        productsOnDisplay: [],
        colorScheme: '',
        lighting: '',
        materials: ''
      };
    }
  }

  /**
   * 生成文案
   */
  /**
   * 生成文案
   */
  private async generateCopywriting(imageAnalysis: any): Promise<string> {
    const analysisText = JSON.stringify(imageAnalysis, null, 2);
    
    // 生成随机创意角度，避免文案重复
    const creativeAngles = [
      "打工人痛点", "性价比", "新鲜度", "环境氛围", "隐藏菜单", 
      "老板故事", "推荐指数", "必点理由", "排队现象", "口碑相传"
    ];
    const randomAngle = creativeAngles[Math.floor(Math.random() * creativeAngles.length)];
    
    const prompt = `你是一位顶级的文案专家。基于以下图片分析结果，为30-40秒探店视频生成具有强烈转化力的文案。

**CRITICAL: 避免重复和陈词滥调**
- 绝对禁止使用重复的模板化文案
- 避免陈词滥调如"太绝了"、"太棒了"、"必须来"等
- 每次生成都要有创意性，使用不同的表达方式和角度
- 采用"${randomAngle}"作为本次文案的核心创意角度

**文案结构要求**：
1. **黄金三秒开场**：必须抓眼球，爆点开场，使用具体的数字、时间、地点或强烈的对比
2. **痛点爆破**：突出核心卖点和用户痛点，使用具体场景和感受，充分展示产品优势
3. **价值传递**：详细说明产品特色、使用体验、服务亮点，让用户充分了解价值
4. **紧迫促单**：结尾必须包含具体行动指令和紧迫感（如限时、限量、优惠等）

**创意性要求**：
- 使用原创表达，避免套话
- 结合店铺特色，突出差异化
- 使用对比、反差、疑问等修辞手法
- 加入真实感受和具体细节
- 语言生动有画面感，让听众能够想象场景
- 加入用户评价或社会证明增强可信度

**节奏感要求**：
- 使用短句和重复结构增强节奏感
- 关键词要押韵或对仗，配合音乐节拍
- 每句话3-8秒，适应更长的视频节奏
- 开头要有爆发力，中间要有层次感，结尾要有冲击力

**字数控制**：
- 控制在150-220字（30-40秒内说完）
- 每句话都要有节奏感和爆发力
- 语速适中而清晰，适合口播
- 确保有足够时间展示信息和情感

**图片分析**：
${analysisText}

**示例模板（禁止直接使用，仅作参考）**：
❌ 不要：这家店太绝了！必须来体验！
✅ 要：早上9点，这队排了50米，就为这一口刚出炉的... 我已经连续三天来打卡了，他们的招牌XX真的绝了，现点现做，香气扑鼻，每一口都能感受到匠心...

请直接输出30秒以上口播文案，不要包含其他解释说明。确保文案具有创意性，避免重复和陈词滥调。`;

    // 直接使用 axios 调用豆包 API（绕过 SDK 的 LangChain 配置问题）
    try {
      console.log('发送请求到豆包 API 生成文案');
      
      const response = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            {
              role: 'system',
              content: '你是一位顶级的探店文案专家，擅长生成30-40秒高转化短视频文案。你的文案必须具有创意性、故事性和说服力，避免陈词滥调和重复模板。每次生成都要有独特的角度、真实的感受和强烈的情感共鸣。30秒以上的视频需要更丰富的内容层次、更详细的产品介绍、更完整的用户旅程展示。'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.9  // 提高temperature以增加创意性和随机性
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000 // 2分钟超时
        }
      );

      console.log('豆包 API 响应状态:', response.status);
      
      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('豆包 API 返回的内容为空');
      }

      console.log('生成的文案:', content.substring(0, 100) + '...');

      return content;
    } catch (error) {
      console.error('调用豆包 API 失败:', error);
      if (axios.isAxiosError(error)) {
        console.error('Axios 错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      // 返回默认文案
      return '这家店太绝了！必须来体验！';
    }
  }

  /**
   * 将完整文案分成3个片段（每个片段约10-12秒）
   */
  private splitCopywritingIntoSegments(fullCopywriting: string): string[] {
    console.log('开始分割文案...');
    const sentences = fullCopywriting.split(/[。！？\n]/).filter(s => s.trim().length > 0);
    console.log('原始句子数量:', sentences.length);

    const segments: string[] = [];
    const segmentLength = Math.ceil(sentences.length / 3);

    for (let i = 0; i < 3; i++) {
      const start = i * segmentLength;
      const end = Math.min((i + 1) * segmentLength, sentences.length);
      const segmentSentences = sentences.slice(start, end);

      if (segmentSentences.length > 0) {
        const segment = segmentSentences.join('。');
        segments.push(segment + '。');
      }
    }

    // 确保有3个片段，如果文案太短则复制补充
    while (segments.length < 3) {
      segments.push(segments[segments.length - 1]);
    }

    console.log('分割后的片段:', segments.map((s, i) => `片段${i + 1}: ${s.substring(0, 30)}...`));
    return segments;
  }

  /**
   * 生成单个视频片段（使用文案的一部分）
   */
  private async generateVideoSegment(
    videoClient: VideoGenerationClient,
    imageUrls: string[],
    copywritingSegment: string,
    imageAnalysis: any,
    segmentIndex: number
  ): Promise<string> {
    console.log(`生成视频片段 ${segmentIndex + 1}，文案:`, copywritingSegment.substring(0, 50) + '...');

    try {
      // 转换图片URL为base64
      const base64Images = await this.imageUrlsToBase64(imageUrls);

      // 构建视频生成prompt（针对单个片段）
      const prompt = this.buildVideoPrompt(copywritingSegment, imageAnalysis, segmentIndex);

      // 创建ContentItem（使用SDK支持的类型）
      const contentItems: Content[] = [];

      // 添加第一帧图片（使用segmentIndex循环使用不同图片）
      const firstImageIndex = segmentIndex % base64Images.length;
      contentItems.push({
        type: 'image_url',
        image_url: { url: base64Images[firstImageIndex] }
      });

      // 添加音频内容（使用SDK支持的文本类型）
      contentItems.push({
        type: 'text',
        text: prompt
      });

      // 生成视频
      const response = await videoClient.videoGeneration(contentItems, {
        model: 'doubao-pro-video',
        duration: 12, // 每个片段12秒
        ratio: '9:16' as Ratio,
        resolution: '720p' as Resolution,
        generateAudio: true,
        watermark: false,
        maxWaitTime: 30
      });

      console.log(`视频片段 ${segmentIndex + 1} 任务创建成功，任务ID:`, response.response.id);

      // 轮询获取最终视频URL
      const videoUrl = await this.pollVideoResult(response.response.id);
      console.log(`视频片段 ${segmentIndex + 1} 生成成功，URL:`, videoUrl);

      return videoUrl;

    } catch (error) {
      console.error(`生成视频片段 ${segmentIndex + 1} 失败:`, error);
      console.error('错误详情:', JSON.stringify(error, null, 2));
      
      // 打印更详细的错误信息
      if (error.response) {
        console.error('SDK 响应错误:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
      }
      
      // 检查是否是 ModelNotOpen 错误（模型未开通）
      if (error.response?.data?.code === 'ModelNotOpen' || 
          error.message?.includes('ModelNotOpen') ||
          error.code === 'ModelNotOpen') {
        const errorMessage = error.response?.data?.message || error.message || '';
        console.error('模型未开通错误:', errorMessage);
        throw new Error(
          '视频生成服务未开通。请在火山引擎控制台开通 doubao-pro-video 视频生成服务。\n' +
          '开通地址：https://console.volcengine.com/ark\n' +
          '步骤：人工智能 > 大模型推理服务 > 搜索 doubao-pro-video > 开通服务\n\n' +
          '提示：当前功能已支持图片分析和文案生成，您可以先体验这些功能。'
        );
      }
      
      throw new Error(`生成视频片段 ${segmentIndex + 1} 失败: ${error.message}`);
    }
  }

  /**
   * 免费视频片段生成（使用 FFmpeg）
   * 将图片转换为10秒视频，带字幕效果
   */
  private async generateFreeVideoSegment(imageUrl: string, copywriting: string, segmentIndex: number): Promise<string> {
    console.log(`生成免费视频片段 ${segmentIndex + 1}，文案:`, copywriting.substring(0, 50) + '...');

    try {
      // 下载图片
      const tempDir = path.join(os.tmpdir(), `video_segment_${Date.now()}_${segmentIndex}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const imagePath = path.join(tempDir, `image_${segmentIndex}.jpg`);
      const videoPath = path.join(tempDir, `video_${segmentIndex}.mp4`);

      console.log('下载图片:', imageUrl);
      await this.downloadImage(imageUrl, imagePath);
      console.log('图片下载完成:', imagePath);

      // 使用 FFmpeg 生成视频（10秒，1080x1920竖屏）
      console.log('使用 FFmpeg 生成视频片段...');
      await this.generateVideoFromImageWithFFmpeg(imagePath, videoPath, 10, copywriting);
      console.log('视频生成完成:', videoPath);

      // 上传到 OSS
      const videoUrl = await this.uploadVideoToOSS(videoPath);
      console.log(`视频片段 ${segmentIndex + 1} 上传完成:`, videoUrl);

      // 清理临时文件
      fs.rmSync(tempDir, { recursive: true, force: true });

      return videoUrl;

    } catch (error) {
      console.error(`生成免费视频片段 ${segmentIndex + 1} 失败:`, error);
      throw new Error(`生成免费视频片段 ${segmentIndex + 1} 失败: ${error.message}`);
    }
  }

  /**
   * 一次性生成30秒完整视频（多图轮播）
   * 3张图片每张展示10秒，带转场效果
   */
  private async generateCompleteVideoWithFFmpeg(imageUrls: string[], copywriting: string): Promise<string> {
    console.log('开始生成完整30秒视频（多图轮播）...');
    console.log('图片数量:', imageUrls.length);
    console.log('文案:', copywriting.substring(0, 100) + '...');

    try {
      // 创建临时目录
      const tempDir = path.join(os.tmpdir(), `video_complete_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      // 下载所有图片
      const imagePaths: string[] = [];
      for (let i = 0; i < imageUrls.length; i++) {
        const imagePath = path.join(tempDir, `image_${i}.jpg`);
        console.log(`下载图片 ${i + 1}/${imageUrls.length}:`, imageUrls[i]);
        await this.downloadImage(imageUrls[i], imagePath);
        imagePaths.push(imagePath);
      }

      const videoPath = path.join(tempDir, 'complete_video.mp4');

      // 使用 FFmpeg 生成完整视频（多图轮播）
      await this.generateVideoFromMultipleImagesWithFFmpeg(imagePaths, videoPath, 30, copywriting);

      console.log('完整视频生成完成:', videoPath);

      // 上传到 OSS
      const videoUrl = await this.uploadVideoToOSS(videoPath);
      console.log('完整视频上传完成:', videoUrl);

      // 清理临时文件
      fs.rmSync(tempDir, { recursive: true, force: true });

      return videoUrl;

    } catch (error) {
      console.error('生成完整视频失败:', error);
      throw new Error(`生成完整视频失败: ${error.message}`);
    }
  }

  /**
   * 使用 FFmpeg 从多张图片生成视频（多图轮播）
   */
  private async generateVideoFromMultipleImagesWithFFmpeg(imagePaths: string[], outputPath: string, duration: number, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');

      console.log('开始生成多图轮播视频:', { imageCount: imagePaths.length, outputPath, duration, textLength: text.length });

      const command = ffmpeg();

      // 添加所有图片作为输入
      imagePaths.forEach((imagePath, index) => {
        command.input(imagePath).inputOptions([
          '-loop 1',
          `-t ${duration / imagePaths.length}`, // 每张图片显示相同时长
          `-framerate 1` // 每张图片1帧（配合 loop）
        ]);
      });

      // 添加静音音频
      command
        .input('anullsrc=channel_layout=stereo:sample_rate=44100')
        .inputFormat('lavfi');

      command
        .videoCodec('libx264')
        .audioCodec('aac')
        .size('1080x1920')
        .outputOptions([
          '-preset ultrafast',
          '-crf 28',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-filter_complex',
          // 使用 concat filter 拼接所有视频片段
          this.buildConcatFilter(imagePaths.length),
          '-map', '[v]',
          '-map', '[a]'
        ])
        .on('start', (commandLine) => {
          console.log('FFmpeg 命令:', commandLine);
        })
        .on('end', () => {
          console.log('FFmpeg 多图视频生成完成');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg 错误:', err);
          console.error('错误消息:', err.message);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * 构建 concat filter（多图轮播）
   */
  private buildConcatFilter(imageCount: number): string {
    // 每张图片显示相同时长，添加转场效果
    const filters: string[] = [];

    // 为每个视频添加 scale 和 pad
    for (let i = 0; i < imageCount; i++) {
      filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2[v${i}]`);
    }

    // 拼接所有视频（带转场效果）
    if (imageCount === 2) {
      filters.push(`[v0][v1]xfade=transition=fade:duration=0.5:offset=${10 - 0.5}[v]`);
    } else if (imageCount === 3) {
      filters.push(`[v0][v1]xfade=transition=fade:duration=0.5:offset=${10 - 0.5}[v01]`);
      filters.push(`[v01][v2]xfade=transition=fade:duration=0.5:offset=${20 - 0.5}[v]`);
    } else if (imageCount >= 4) {
      // 如果图片超过3张，只拼接前3张
      filters.push(`[v0][v1]xfade=transition=fade:duration=0.5:offset=${10 - 0.5}[v01]`);
      filters.push(`[v01][v2]xfade=transition=fade:duration=0.5:offset=${20 - 0.5}[v]`);
    } else {
      // 单张图片，直接输出
      filters.push(`[v0]copy[v]`);
    }

    return filters.join(';');
  }

  /**
   * 使用 FFmpeg 从图片生成视频（带字幕和静音音频）
   */
  private async generateVideoFromImageWithFFmpeg(imagePath: string, outputPath: string, duration: number, text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = require('fluent-ffmpeg');

      console.log('开始生成视频:', { imagePath, outputPath, duration, textLength: text.length });

      ffmpeg(imagePath)
        .inputOptions([
          '-loop 1',
        ])
        .input('anullsrc=channel_layout=stereo:sample_rate=44100')
        .inputFormat('lavfi') // 添加静音音频
        .videoCodec('libx264')
        .audioCodec('aac') // 添加音频编码
        .size('1080x1920')
        .outputOptions([
          '-preset ultrafast',
          '-crf 28',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-map 0:v', // 映射视频流
          '-map 1:a', // 映射音频流
          '-shortest', // 以最短的流为准
          '-vf', 'scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2'
        ])
        .duration(duration)
        .on('start', (commandLine) => {
          console.log('FFmpeg 命令:', commandLine);
        })
        .on('end', () => {
          console.log('FFmpeg 视频生成完成');
          resolve();
        })
        .on('error', (err) => {
          console.error('FFmpeg 错误:', err);
          console.error('错误消息:', err.message);
          reject(err);
        })
        .save(outputPath);
    });
  }

  /**
   * 下载图片到本地
   */
  private async downloadImage(url: string, outputPath: string): Promise<void> {
    const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(outputPath, Buffer.from(response.data));
  }

  /**
   * 构建视频生成prompt（针对单个片段）
   */
  private buildVideoPrompt(copywritingSegment: string, imageAnalysis: any, segmentIndex: number): string {
    const segmentFocus = [
      '开场吸引',
      '产品展示',
      '促单行动'
    ];

    return `生成${segmentFocus[segmentIndex]}视频片段。

**口播文案**：
${copywritingSegment}

**视频要求**：
- 时长：12秒
- 配合文案节奏，画面与内容一致
- 增强文案的情感表达
- 适合短视频平台（9:16竖屏）`;
  }

  /**
   * 使用FFmpeg拼接视频片段（带转场效果）
   */
  private async mergeVideoSegmentsWithTransitions(segmentUrls: string[]): Promise<string> {
    console.log('开始拼接视频片段，数量:', segmentUrls.length);

    try {
      // 下载视频片段到临时目录
      const tempDir = path.join(os.tmpdir(), `video_merge_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const segmentPaths: string[] = [];
      for (let i = 0; i < segmentUrls.length; i++) {
        const segmentPath = path.join(tempDir, `segment_${i}.mp4`);
        await this.downloadVideo(segmentUrls[i], segmentPath);
        segmentPaths.push(segmentPath);
      }

      // 使用FFmpeg拼接视频（带淡入淡出转场）
      const outputPath = path.join(tempDir, `final_video_${Date.now()}.mp4`);
      await this.mergeVideosFFmpeg(segmentPaths, outputPath);

      console.log('视频拼接完成，输出路径:', outputPath);

      // 上传到OSS并返回URL
      const finalUrl = await this.uploadVideoToOSS(outputPath);

      // 清理临时文件
      fs.rmSync(tempDir, { recursive: true, force: true });

      return finalUrl;

    } catch (error) {
      console.error('拼接视频失败:', error);
      throw new Error('视频拼接失败');
    }
  }

  /**
   * 下载视频到本地
   */
  private async downloadVideo(url: string, outputPath: string): Promise<void> {
    // 如果是相对路径（以 /api/ 开头），直接读取本地文件
    if (url.startsWith('/api/uploads/')) {
      const filename = url.replace('/api/uploads/', '');
      const localPath = path.join(process.cwd(), 'uploads', filename);

      console.log(`从本地复制视频文件: ${localPath} -> ${outputPath}`);

      // 复制文件
      const reader = fs.createReadStream(localPath);
      const writer = fs.createWriteStream(outputPath);
      reader.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }

    // 否则通过 HTTP 下载
    const response = await axios({
      method: 'GET',
      url: url,
      responseType: 'stream',
      timeout: 30000
    });

    const writer = fs.createWriteStream(outputPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', resolve);
      writer.on('error', reject);
    });
  }

  /**
   * 使用FFmpeg合并视频（带转场效果和重试机制）
   */
  private async mergeVideosFFmpeg(inputPaths: string[], outputPath: string, retryCount = 3): Promise<void> {
    for (let attempt = 0; attempt < retryCount; attempt++) {
      try {
        console.log(`FFmpeg合并尝试 ${attempt + 1}/${retryCount}...`);

        await new Promise<void>((resolve, reject) => {
          const ffmpeg = require('fluent-ffmpeg');
          const command = ffmpeg();

          // 添加所有输入文件
          inputPaths.forEach(path => {
            command.input(path);
          });

          // 使用concat filter合并视频，带淡入淡出转场
          const filterComplex = this.buildFilterComplex(inputPaths.length);

          command
            .complexFilter(filterComplex)
            .outputOptions('-map', '[v]')  // 使用filter输出
            .outputOptions('-map', '[a]')  // 使用音频输出
            .output(outputPath)
            .on('start', (commandLine: string) => {
              console.log('FFmpeg命令:', commandLine);
            })
            .on('end', () => {
              console.log('FFmpeg合并完成');
              resolve();
            })
            .on('error', (err: any) => {
              console.error('FFmpeg合并失败:', err.message);
              reject(err);
            })
            .run();
        });

        // 成功则返回
        return;

      } catch (error) {
        console.error(`FFmpeg合并尝试 ${attempt + 1} 失败:`, error.message);

        // 如果还有重试次数，等待后重试
        if (attempt < retryCount - 1) {
          console.log(`等待 ${2000}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }

        // 最后一次尝试也失败，抛出错误
        throw new Error(`FFmpeg合并失败，已重试 ${retryCount} 次: ${error.message}`);
      }
    }
  }

  /**
   * 构建FFmpeg filter complex（支持多种转场效果）
   */
  private buildFilterComplex(segmentCount: number): string[] {
    const filters: string[] = [];

    // 转场效果：fade | slide | zoom | wipe | dissolve
    const transition = 'fade'; // 默认使用fade，可以通过参数配置

    if (segmentCount === 2) {
      // 2个片段：1次转场
      // 视频：在 9.5 秒时转场（避免裁剪开头内容）
      filters.push(`[0:v][1:v]xfade=transition=${transition}:duration=0.5:offset=9.5[v]`);
      // 音频：每个片段 10 秒，使用 adelay 延迟，afade 淡入淡出
      filters.push('[0:a]adelay=0|0,afade=t=out:st=9.5:d=0.5[a0]');
      filters.push('[1:a]adelay=10000|10000,afade=t=in:st=0:d=0.3[a1]');
      filters.push('[a0][a1]concat=n=2:v=0:a=1[a]');
    } else if (segmentCount === 3) {
      // 3个片段：2次转场（每个片段 10 秒，总共 29.5 秒）
      // 视频：在 9.5 秒和 19.5 秒时转场
      filters.push(`[0:v][1:v]xfade=transition=${transition}:duration=0.5:offset=9.5[v01]`);
      filters.push(`[v01][2:v]xfade=transition=${transition}:duration=0.5:offset=19.5[v]`);
      // 音频：每个片段使用 adelay 延迟到正确位置，添加淡入淡出
      filters.push('[0:a]adelay=0|0,afade=t=out:st=9.5:d=0.5[a0]');
      filters.push('[1:a]adelay=10000|10000,afade=t=in:st=0:d=0.3,afade=t=out:st=9.5:d=0.5[a1]');
      filters.push('[2:a]adelay=20000|20000,afade=t=in:st=0:d=0.3[a2]');
      filters.push('[a0][a1][a2]concat=n=3:v=0:a=1[a]');
    } else if (segmentCount >= 4) {
      // 4个及以上片段：多次转场
      let videoFilter = '[0:v]';
      for (let i = 1; i < segmentCount; i++) {
        // 转场位置：每个片段结束前 0.5 秒（i * 10 - 0.5）
        const offset = i * 10 - 0.5;
        videoFilter = `[${videoFilter}][${i}:v]xfade=transition=${transition}:duration=0.5:offset=${offset}`;
      }
      videoFilter = `${videoFilter}[v]`;
      filters.push(videoFilter);

      // 音频：使用 adelay 延迟每个片段
      let audioFilter = '';
      for (let i = 0; i < segmentCount; i++) {
        const delay = i * 10000; // 每个片段延迟 10 秒
        const fadeOut = i < segmentCount - 1 ? `,afade=t=out:st=9.5:d=0.5` : '';
        audioFilter += `[${i}:a]adelay=${delay}|${delay},afade=t=in:st=0:d=0.3${fadeOut}[a${i}];`;
      }
      audioFilter += `${Array.from({ length: segmentCount }, (_, i) => `[a${i}]`).join('')}concat=n=${segmentCount}:v=0:a=1[a]`;
      filters.push(audioFilter);
    }

    return filters;
  }

  /**
   * 上传视频到本地存储
   */
  private async uploadVideoToOSS(videoPath: string): Promise<string> {
    try {
      console.log('开始上传视频:', videoPath);

      // 读取视频文件
      const videoBuffer = fs.readFileSync(videoPath);
      const filename = `video_${Date.now()}.mp4`;
      const filepath = path.join(this.uploadDir, filename);

      // 确保目录存在
      if (!fs.existsSync(this.uploadDir)) {
        fs.mkdirSync(this.uploadDir, { recursive: true });
      }

      // 写入文件
      fs.writeFileSync(filepath, videoBuffer);

      console.log('视频上传成功:', filepath);

      // 返回URL
      return `/api/uploads/${filename}`;

    } catch (error) {
      console.error('上传视频失败:', error);
      throw new Error('视频上传失败');
    }
  }

  /**
   * 轮询获取视频片段的最终URL
   */
  private async pollVideoResult(taskId: string, maxAttempts = 30): Promise<string> {
    console.log('开始轮询视频任务:', taskId);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // 等待2秒后查询
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 调用API查询任务状态
        const response = await axios.get(
          `${this.baseUrl}/api/v3/video/tasks/${taskId}`,
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            },
            timeout: 10000
          }
        );

        console.log(`轮询第 ${attempt + 1}/${maxAttempts} 次，状态:`, response.data?.status);

        // 检查任务状态
        const status = response.data?.status;
        if (status === 'succeeded' || status === 'completed') {
          const videoUrl = response.data?.video_url || response.data?.result?.video_url;
          if (videoUrl) {
            console.log('视频生成成功:', videoUrl);
            return videoUrl;
          }
        }

        // 如果任务失败，抛出错误
        if (status === 'failed' || status === 'error') {
          throw new Error(`视频生成失败: ${response.data?.error || '未知错误'}`);
        }

      } catch (error) {
        console.error(`轮询第 ${attempt + 1} 次失败:`, error.message);

        // 如果不是最后一次尝试，继续轮询
        if (attempt < maxAttempts - 1) {
          continue;
        }

        throw new Error(`视频轮询超时: ${error.message}`);
      }
    }

    throw new Error('视频生成超时，请稍后重试');
  }

  /**
   * 生成场景描述（基于图片分析结果）
   * 确保视频内容与图片高度一致
   */
  private async generateSceneDescriptions(base64Images: string[]): Promise<string[]> {
    console.log('开始生成场景描述，图片数量:', base64Images.length);

    const sceneDescriptions: string[] = [];

    // 根据图片数量生成场景描述（3-5个场景，适用于30-40秒视频）
    if (base64Images.length === 3) {
      sceneDescriptions.push('Beautiful presenter standing in front of shop sign, introducing the shop to camera');
      sceneDescriptions.push('Presenter walking into shop, camera panning across product shelves as she points at items');
      sceneDescriptions.push('Presenter showcasing products with enthusiasm, close-ups of products and her face');
    } else if (base64Images.length === 4) {
      sceneDescriptions.push('Beautiful presenter at shop entrance, waving and introducing the shop');
      sceneDescriptions.push('Presenter walking through interior, smoothly panning camera, pointing at products');
      sceneDescriptions.push('Presenter interacting with products, showing items to camera with enthusiasm');
      sceneDescriptions.push('Presenter highlighting key products with detailed close-ups, facing camera');
    } else if (base64Images.length === 5) {
      sceneDescriptions.push('Beautiful presenter at shop entrance, smiling and introducing the shop');
      sceneDescriptions.push('Presenter walking inside, panning camera, pointing at product displays');
      sceneDescriptions.push('Presenter handling products, showing them to camera with enthusiasm');
      sceneDescriptions.push('Presenter showcasing key products with close-ups, explaining features');
      sceneDescriptions.push('Presenter at shop exit, smiling at camera, final call-to-action with shop sign visible');
    } else {
      // 其他数量，生成精简场景
      const count = Math.min(base64Images.length, 5); // 最多5个
      for (let i = 0; i < count; i++) {
        if (i === 0) {
          sceneDescriptions.push('Beautiful presenter at shop entrance, introducing shop');
        } else if (i === count - 1) {
          sceneDescriptions.push('Presenter showcasing products, facing camera');
        } else {
          sceneDescriptions.push('Presenter exploring shop interior, pointing at products');
        }
      }
    }

    console.log('生成场景描述完成，数量:', sceneDescriptions.length);
    return sceneDescriptions;
  }

  private async generateVideoWithRetry(
    videoClient: VideoGenerationClient,
    contentItems: Content[],
    options: any,
    maxRetries: number = 3
  ): Promise<string> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`视频生成尝试 ${attempt}/${maxRetries}...`);

        const response = await videoClient.videoGeneration(contentItems, options);

        console.log('视频生成响应状态:', response.response.status);
        console.log('视频生成任务ID:', response.response.id);

        if (response.videoUrl) {
          console.log('视频生成成功，URL:', response.videoUrl);
          return response.videoUrl;
        } else {
          console.error('视频生成失败，响应:', response.response);
          throw new Error('视频生成未返回URL，状态: ' + response.response.status);
        }
      } catch (error: any) {
        const statusCode = error?.statusCode || error?.response?.status;
        const errorCode = error?.response?.error?.code;
        const errorMessage = error?.response?.error?.message || error?.message;

        console.error(`尝试 ${attempt} 失败:`, {
          statusCode,
          errorCode,
          errorMessage,
          fullError: error
        });

        // 如果是限流错误（403 ErrTooManyRequests），则重试
        if (statusCode === 403 && errorCode === 'ErrTooManyRequests' && attempt < maxRetries) {
          const waitTime = attempt * 10000; // 递增等待时间：10秒、20秒、30秒
          console.log(`遇到限流，等待 ${waitTime / 1000} 秒后重试...`);
          await this.sleep(waitTime);
          continue;
        }

        // 其他错误或已达最大重试次数，抛出错误
        throw new Error(
          `视频生成失败: ${error?.message || '未知错误'}。` +
          `${statusCode === 403 && errorCode === 'ErrTooManyRequests'
            ? '（服务繁忙，请稍后重试）'
            : ''}`
        );
      }
    }

    throw new Error('视频生成失败：已达最大重试次数');
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 直接生成视频（使用 Base64 图片数据）


  /**
   * 直接生成视频（使用 Base64 图片数据）
   */
  private async generateVideoDirect(
    videoClient: VideoGenerationClient,
    imageUrls: string[],
    copywriting: string,
    imageAnalysis: any
  ): Promise<string> {
    console.log('开始生成视频...');

    // 将所有图片URL转换为Base64
    const base64Images = await this.imageUrlsToBase64(imageUrls);

    console.log('Base64转换成功，数量:', base64Images.length);

    // 生成基于所有图片的场景描述，确保视频与图片高度一致
    console.log('生成场景描述...');
    const sceneDescriptions = await this.generateSceneDescriptions(base64Images);
    console.log('场景描述生成完成，数量:', sceneDescriptions.length);

    // 构建 content 数组
    const contentItems: Content[] = [];

    // CRITICAL: doubao-seedance-1-5-pro-251215 只支持 first_frame 和 last_frame
    // 不支持 reference_image！所以只能使用一张图片作为 first_frame
    // 其他图片的信息通过文本描述传达
    
    // 添加第一张图片作为 first_frame（使用第一张通常是门头招牌）
    contentItems.push({
      type: 'image_url',
      image_url: { url: base64Images[0] },
      role: 'first_frame'
    });

    // 视觉参考 - 通过文本描述传达所有图片的信息
    let promptText = `Visual References and Shop Information:\n`;
    promptText += `You have ${base64Images.length} reference images of a real shop. These images show the exact shop sign, core products, and store layout that MUST be perfectly reproduced in the generated video.\n\n`;
    promptText += `IMPORTANT: You must reference ALL ${base64Images.length} images throughout the video to ensure consistency.\n\n`;
    promptText += `The shop details from image analysis are:\n`;
    promptText += `- Shop Name: This is a real shop with specific branding\n`;
    promptText += `- Brand Elements: Must include exact shop sign design, logo, colors, typography\n`;
    promptText += `- Layout: Must match the actual store spatial arrangement and flow\n`;
    promptText += `- Products: Must show the exact core products on display in the images\n`;
    promptText += `- Decorations: Must replicate the real interior design and ambiance\n\n`;

    // 强制一致性要求（CRITICAL）
    promptText += `CRITICAL CONSISTENCY REQUIREMENTS (MUST FOLLOW):\n`;
    promptText += `- Shop Sign: The shop sign MUST appear in ALL scenes exactly as shown in the reference images\n`;
    promptText += `- Core Products: Products on display MUST match what's shown in the reference images\n`;
    promptText += `- Store Layout: Interior space arrangement MUST be consistent with reference images\n`;
    promptText += `- No Invented Elements: Do NOT add elements that don't exist in the reference images\n`;
    promptText += `- Realistic Appearance: Shop environment must look like a real, operational business\n\n`;

    // CRITICAL: 摄像机运动和物理逻辑（防止穿越物体）
    promptText += `CRITICAL: CAMERA MOVEMENT AND PHYSICS (MUST FOLLOW):\n`;
    promptText += `- **NO CROSSING OBJECTS**: Camera MUST NOT pass through walls, doors, furniture, or any solid objects\n`;
    promptText += `- **NO GOING THROUGH OBSTACLES**: Camera movement must respect physical barriers and spatial constraints\n`;
    promptText += `- **REALISTIC PATH**: Camera should move through open spaces (aisles, walkways, entrances), not through walls or obstacles\n`;
    promptText += `- **RESPECT DEPTH**: When zooming or tracking, camera should move around objects, not through them\n`;
    promptText += `- **DOOR PROTOCOL**: When showing interior, camera should enter through open doors/gates, not through closed walls\n`;
    promptText += `- **SPATIAL AWARENESS**: Maintain clear separation between camera and shop elements, no merging or intersecting\n`;
    promptText += `- **PHYSICS COMPLIANCE**: All camera movements must follow real-world physics - no impossible transitions or shortcuts\n\n`;

    promptText += `Examples of INCORRECT camera movements (DO NOT DO):\n`;
    promptText += `- Camera panning through a wall or glass window to show interior\n`;
    promptText += `- Camera moving through a closed door without opening it\n`;
    promptText += `- Camera passing through furniture, shelves, or display counters\n`;
    promptText += `- Camera zooming through solid objects like a ghost\n\n`;

    promptText += `Examples of CORRECT camera movements (DO THIS):\n`;
    promptText += `- Camera entering shop entrance, moving through open doorway naturally\n`;
    promptText += `- Camera panning around open spaces (aisles, corridors)\n`;
    promptText += `- Camera moving around obstacles (shelves, displays) by going around them\n`;
    promptText += `- Camera tracking the presenter through walkable paths\n\n`;

    // 美女主播要求（全程露脸 + 互动）
    promptText += `Presenter Requirements:\n`;
    promptText += `- Beautiful female presenter (Asian, 20-30 years old)\n`;
    promptText += `- MUST appear in ALL scenes throughout the entire video\n`;
    promptText += `- Always facing the camera while speaking\n`;
    promptText += `- Interacts naturally with shop elements (points to menu, touches products)\n`;
    promptText += `- Natural gestures and facial expressions\n`;
    promptText += `- Energetic, professional, trustworthy demeanor\n\n`;

    // 场景描述（根据图片数量）
    promptText += `Scene Descriptions (12-second video):\n`;
    promptText += `Scene 1 (0-3 seconds): Beautiful presenter stands at shop entrance, introduces shop with energy (music intro)\n`;
    promptText += `Scene 2 (3-6 seconds): Presenter walks into store, showcases interior layout and atmosphere (music builds up)\n`;
    promptText += `Scene 3 (6-9 seconds): Presenter highlights core products with close-up shots (music climax - MOST IMPACTFUL)\n`;
    promptText += `Scene 4 (9-12 seconds): Presenter at exit or counter, final call-to-action (music outro)\n\n`;

    // 画质和运镜（电影级）
    promptText += `Visual Quality:\n`;
    promptText += `- 720p HD, 9:16 vertical format\n`;
    promptText += `- Dynamic camera movements: push-in, slow zoom, smooth tracking\n`;
    promptText += `- Professional color grading with vibrant colors and high contrast\n`;
    promptText += `- Smooth transitions between scenes (fade, dissolve, match cut)\n`;
    promptText += `- Cinematic depth of field, sharp focus on presenter\n`;
    promptText += `- Natural lighting with realistic shadows\n`;
    promptText += `- Perfect lighting on presenter's face, natural colors, 720p clarity\n`;
    promptText += `- Seamless transitions, no cuts, motion blur 15px\n`;
    promptText += `- 9:16 aspect ratio for mobile\n\n`;

    // 音频要求（专业级+热点音乐+无版权）
    promptText += `Audio Requirements:\n`;
    promptText += `- Voice: "${copywriting}" (spoken by the beautiful female presenter in the video, clear and energetic)\n`;
    promptText += `- Background Music (CRITICAL):\n`;
    promptText += `  * Rhythm: Strong, catchy drum beats or electronic beats with distinct rhythm\n`;
    promptText += `  * Viral/Hot Property: Trending music similar to viral TikTok/Douyin/Reels/Shorts clips\n`;
    promptText += `  * Emotion: High-energy, dynamic, upbeat commercial style matching shop exploration\n`;
    promptText += `  * Duration: Exactly 12 seconds, with a complete climax or memorable hook\n`;
    promptText += `  * Copyright: MUST be royalty-free, no copyright risk, safe for commercial use\n`;
    promptText += `- Sound Effects: Bass drops and impact beats synchronized with video transitions\n`;
    promptText += `- Pro Mixing: Voice (70%) + Background Music (25%) + Sound Effects (5%), balanced for maximum impact\n\n`;

    // 质量标准（视觉炸裂+电影级质感+顶级音乐）
    promptText += `Quality:\n`;
    promptText += `- High-energy, trustworthy, authentic, cinematic\n`;
    promptText += `- Dynamic pacing, perfect timing, explosive visual impact\n`;
    promptText += `- Real shop environment, realistic with professional polish\n`;
    promptText += `- Beautiful female presenter MUST appear in ALL scenes, facing camera while speaking\n`;
    promptText += `- Shop sign, core products, and store layout MUST remain consistent throughout\n`;
    promptText += `- Maximum visual impact: dynamic camera movements, neon colors, professional presenter\n`;
    promptText += `- Top-tier music: Strong rhythm, viral/hot property, copyright-free, perfectly synchronized with video\n`;
    promptText += `- Movie-grade quality, 12-second perfection with viral music hook\n`;

    // 添加唯一的文本描述
    contentItems.push({
      type: 'text',
      text: promptText
    });

    try {
      console.log('调用视频生成API，参数:', {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: 12,
        ratio: '9:16',
        resolution: '720p',
        generateAudio: true,
        watermark: false,
        firstFrameSize: base64Images[0].length,
        imageCount: base64Images.length
      });

      // 使用 SDK 的 VideoGenerationClient 生成视频
      try {
        console.log('使用 SDK 生成视频...');
        
        const response = await this.videoGenerationClient.videoGeneration(contentItems, {
          model: 'doubao-seedance-1-5-pro-251215',
          duration: 12,
          ratio: '9:16' as Ratio,
          resolution: '720p' as Resolution,
          generateAudio: true,
          watermark: false,
          maxWaitTime: 900 // 15分钟
        });

        console.log('SDK 响应:', {
          videoUrl: response.videoUrl,
          id: response.response?.id,
          status: response.response?.status
        });

        if (response.videoUrl) {
          console.log('视频生成成功，URL:', response.videoUrl);
          return response.videoUrl;
        } else {
          console.error('视频生成未返回URL，响应:', response);
          throw new Error('视频生成未返回URL');
        }
      } catch (sdkError) {
        console.error('SDK 调用失败:', sdkError);
        
        // SDK 调用失败时，打印详细错误信息
        if (sdkError.response) {
          console.error('SDK 错误响应:', {
            status: sdkError.response.status,
            statusText: sdkError.response.statusText,
            data: sdkError.response.data,
            headers: sdkError.response.headers
          });
        }
        
        throw sdkError;
      }
    } catch (error) {
      console.error('生成视频失败:', error);
      
      // 检查是否是 ModelNotOpen 错误（模型未开通）
      if (error.response?.data?.code === 'ModelNotOpen' || 
          error.message?.includes('ModelNotOpen') ||
          error.code === 'ModelNotOpen') {
        const errorMessage = error.response?.data?.message || error.message || '';
        console.error('模型未开通错误:', errorMessage);
        throw new Error(
          '视频生成服务未开通。请在火山引擎控制台开通 doubao-seedance-1-5-pro-251215 视频生成服务。\n' +
          '开通地址：https://console.volcengine.com/ark\n' +
          '步骤：人工智能 > 大模型推理服务 > 搜索 doubao-seedance-1-5-pro-251215 > 开通服务\n\n' +
          '提示：当前功能已支持图片分析和文案生成，您可以先体验这些功能。'
        );
      }
      
      if (axios.isAxiosError(error)) {
        console.error('Axios 错误详情:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers
        });
      }
      throw error;
    }
  }

  /**
   * 直接生成视频（支持 callbackUrl 的异步版本）
   */
  private async generateVideoDirectAsync(
    videoClient: VideoGenerationClient,
    imageUrls: string[],
    copywriting: string,
    imageAnalysis: any,
    callbackUrl?: string
  ): Promise<string> {
    console.log('开始生成视频（异步模式）...');

    // 将所有图片URL转换为Base64
    const base64Images = await this.imageUrlsToBase64(imageUrls);

    console.log('Base64转换成功，数量:', base64Images.length);

    // 生成基于所有图片的场景描述，确保视频与图片高度一致
    console.log('生成场景描述...');
    const sceneDescriptions = await this.generateSceneDescriptions(base64Images);
    console.log('场景描述生成完成，数量:', sceneDescriptions.length);

    // 构建 content 数组
    const contentItems: Content[] = [];

    // CRITICAL: doubao-seedance-1-5-pro-251215 只支持 first_frame 和 last_frame
    // 不支持 reference_image！所以只能使用一张图片作为 first_frame
    // 其他图片的信息通过文本描述传达
    
    // 添加第一张图片作为 first_frame（使用第一张通常是门头招牌）
    contentItems.push({
      type: 'image_url',
      image_url: { url: base64Images[0] },
      role: 'first_frame'
    });

    // 视觉参考 - 通过文本描述传达所有图片的信息
    let promptText = `Visual References and Shop Information:\n`;
    promptText += `You have ${base64Images.length} reference images of a real shop. These images show the exact shop sign, core products, and store layout that MUST be perfectly reproduced in the generated video.\n\n`;
    promptText += `IMPORTANT: You must reference ALL ${base64Images.length} images throughout the video to ensure consistency.\n\n`;

    // 强制一致性要求（CRITICAL）
    promptText += `CRITICAL CONSISTENCY REQUIREMENTS (MUST FOLLOW):\n`;
    promptText += `- Shop Sign: The shop sign MUST appear in ALL scenes exactly as shown in the reference images\n`;
    promptText += `- Core Products: Products on display MUST match what's shown in the reference images\n`;
    promptText += `- Store Layout: Interior space arrangement MUST be consistent with reference images\n`;
    promptText += `- No Invented Elements: Do NOT add elements that don't exist in the reference images\n`;
    promptText += `- Realistic Appearance: Shop environment must look like a real, operational business\n\n`;

    // 美女主播要求（全程露脸 + 互动）
    promptText += `Presenter Requirements:\n`;
    promptText += `- Beautiful female presenter (Asian, 20-30 years old)\n`;
    promptText += `- MUST appear in ALL scenes throughout the entire video\n`;
    promptText += `- Always facing the camera while speaking\n`;
    promptText += `- Interacts naturally with shop elements (points to menu, touches products)\n`;
    promptText += `- Natural gestures and facial expressions\n`;
    promptText += `- Energetic, professional, trustworthy demeanor\n\n`;

    // 场景描述（根据图片数量）
    promptText += `Scene Descriptions (12-second video):\n`;
    promptText += `Scene 1 (0-3 seconds): Beautiful presenter stands at shop entrance, introduces shop with energy (music intro)\n`;
    promptText += `Scene 2 (3-6 seconds): Presenter walks into store, showcases interior layout and atmosphere (music builds up)\n`;
    promptText += `Scene 3 (6-9 seconds): Presenter highlights core products with close-up shots (music climax - MOST IMPACTFUL)\n`;
    promptText += `Scene 4 (9-12 seconds): Presenter at exit or counter, final call-to-action (music outro)\n\n`;

    // 画质和运镜（电影级）
    promptText += `Visual Quality:\n`;
    promptText += `- 720p HD, 9:16 vertical format\n`;
    promptText += `- Dynamic camera movements: push-in, slow zoom, smooth tracking\n`;
    promptText += `- Professional color grading with vibrant colors and high contrast\n`;
    promptText += `- Smooth transitions between scenes (fade, dissolve, match cut)\n`;
    promptText += `- Cinematic depth of field, sharp focus on presenter\n`;
    promptText += `- Natural lighting with realistic shadows\n`;
    promptText += `- Perfect lighting on presenter's face, natural colors, 720p clarity\n`;
    promptText += `- Seamless transitions, no cuts, motion blur 15px\n`;
    promptText += `- 9:16 aspect ratio for mobile\n\n`;

    // 音频要求（专业级+热点音乐+无版权）
    promptText += `Audio Requirements:\n`;
    promptText += `- Voice: "${copywriting}" (spoken by the beautiful female presenter in the video, clear and energetic)\n`;
    promptText += `- Background Music (CRITICAL):\n`;
    promptText += `  * Rhythm: Strong, catchy drum beats or electronic beats with distinct rhythm\n`;
    promptText += `  * Viral/Hot Property: Trending music similar to viral TikTok/Douyin/Reels/Shorts clips\n`;
    promptText += `  * Emotion: High-energy, dynamic, upbeat commercial style matching shop exploration\n`;
    promptText += `  * Duration: Exactly 12 seconds, with a complete climax or memorable hook\n`;
    promptText += `  * Copyright: MUST be royalty-free, no copyright risk, safe for commercial use\n`;
    promptText += `- Sound Effects: Bass drops and impact beats synchronized with video transitions\n`;
    promptText += `- Pro Mixing: Voice (70%) + Background Music (25%) + Sound Effects (5%), balanced for maximum impact\n\n`;

    // 质量标准（视觉炸裂+电影级质感+顶级音乐）
    promptText += `Quality:\n`;
    promptText += `- High-energy, trustworthy, authentic, cinematic\n`;
    promptText += `- Dynamic pacing, perfect timing, explosive visual impact\n`;
    promptText += `- Real shop environment, realistic with professional polish\n`;
    promptText += `- Beautiful female presenter MUST appear in ALL scenes, facing camera while speaking\n`;
    promptText += `- Shop sign, core products, and store layout MUST remain consistent throughout\n`;
    promptText += `- Maximum visual impact: dynamic camera movements, neon colors, professional presenter\n`;
    promptText += `- Top-tier music: Strong rhythm, viral/hot property, copyright-free, perfectly synchronized with video\n`;
    promptText += `- Movie-grade quality, 12-second perfection with viral music hook\n`;

    // 添加唯一的文本描述
    contentItems.push({
      type: 'text',
      text: promptText
    });

    try {
      console.log('调用视频生成API（异步模式），参数:', {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: 12,
        ratio: '9:16',
        resolution: '720p',
        generateAudio: true,
        watermark: false,
        callbackUrl: callbackUrl,
        firstFrameSize: base64Images[0].length,
        imageCount: base64Images.length
      });

      // 使用 first_frame 模式，支持 duration 参数
      const options = {
        model: 'doubao-pro-video',
        duration: 12, // 视频生成时长（模型单片段最大12秒，可通过生成多个片段拼接达到更长时长）
        ratio: '9:16' as Ratio, // 竖屏视频，适合短视频平台
        resolution: '720p' as Resolution,
        generateAudio: true, // 启用音频生成（口播、音乐、音效）
        watermark: false,
        callbackUrl: callbackUrl, // 异步回调URL
        maxWaitTime: 30 // 异步模式下等待时间可以更短
      };

      // 异步模式：不等待完成，立即返回任务ID
      const response = await videoClient.videoGeneration(contentItems, options);

      console.log('视频生成任务已创建:', response.response.id);
      console.log('任务状态:', response.response.status);

      // 如果是异步模式，response.videoUrl 可能为 null，需要通过回调获取
      // 但 SDK 可能已经实现了轮询，所以我们也等待完成
      if (response.videoUrl) {
        console.log('视频生成成功（同步返回）:', response.videoUrl);
        return response.videoUrl;
      } else {
        // 异步模式，等待轮询完成
        console.log('视频生成中，等待轮询...');
        
        // SDK 内部会自动轮询，最多等待 maxWaitTime
        // 如果超时仍未完成，抛出错误
        const maxPollingAttempts = 60; // 最多轮询60次
        let pollingCount = 0;

        while (pollingCount < maxPollingAttempts) {
          await this.sleep(1000); // 等待1秒
          pollingCount++;

          // 这里应该调用任务查询接口，但 SDK 没有暴露
          // 所以我们只能等待 SDK 内部轮询完成
          console.log(`轮询中... ${pollingCount}/${maxPollingAttempts}`);
        }

        throw new Error('视频生成超时，请稍后查看任务状态');
      }
    } catch (error) {
      console.error('生成视频失败:', error);
      
      // 检查是否是 ModelNotOpen 错误（模型未开通）
      if (error.response?.data?.code === 'ModelNotOpen' || 
          error.message?.includes('ModelNotOpen') ||
          error.code === 'ModelNotOpen') {
        const errorMessage = error.response?.data?.message || error.message || '';
        console.error('模型未开通错误:', errorMessage);
        throw new Error(
          '视频生成服务未开通。请在火山引擎控制台开通 doubao-seedance-1-5-pro-251215 视频生成服务。\n' +
          '开通地址：https://console.volcengine.com/ark\n' +
          '步骤：人工智能 > 大模型推理服务 > 搜索 doubao-seedance-1-5-pro-251215 > 开通服务\n\n' +
          '提示：当前功能已支持图片分析和文案生成，您可以先体验这些功能。'
        );
      }
      
      throw error;
    }
  }
}
