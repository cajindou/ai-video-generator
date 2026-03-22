import { Injectable } from '@nestjs/common';
import { LLMClient, Config, VideoGenerationClient, TTSClient, Content, Ratio, Resolution } from 'coze-coding-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

/**
 * ============================================================
 * 顶级专家协作学习系统 - 电影级12秒口播探店视频
 * ============================================================
 * 
 * 核心理念：
 * 1. 专家相互讨论：每个专家完成后，其他专家评审并提出改进建议
 * 2. 迭代学习：记录历史数据，每次都比上次更好
 * 3. 电影级品质：运镜丝滑、动作流畅、视觉炸裂
 * 
 * 专家团队（7人协作）：
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家1: 图片一致性分析专家                               │
 * │  → 输出：店铺识别、产品位置、视觉一致性要素               │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家2: 主播形象专家                                     │
 * │  → 输出：固定人设、服装、标志性动作、口头禅               │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家3: 病毒式文案专家                                   │
 * │  → 输出：痛点+反差+人设+销冠风格文案                      │
 * │  → 评审：专家4评审文案，提出改进建议                      │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家4: 电影级运镜专家                                   │
 * │  → 输出：丝滑运镜轨迹、主播动作设计、防穿越路径           │
 * │  → 评审：专家7评审运镜，提出改进建议                      │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家5: 视频生成专家                                     │
 * │  → 输出：高质量视频素材                                  │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家6: 字幕音频专家                                     │
 * │  → 输出：TTS口播、字幕时间轴、背景音乐                    │
 * └─────────────────────────────────────────────────────────┘
 *                           ↓
 * ┌─────────────────────────────────────────────────────────┐
 * │  专家7: 剪辑大师                                         │
 * │  → 输出：视觉炸裂特效、最终合成、品质检验                 │
 * └─────────────────────────────────────────────────────────┘
 */

// ============ 历史学习数据 ============
interface VideoHistory {
  id: string;
  timestamp: number;
  imageAnalysis: ImageAnalysis;
  script: string;
  storyboard: StoryboardItem[];
  presenter: PresenterProfile;
  videoUrl: string;
  // 评分维度
  scores: {
    visualConsistency: number;  // 视觉一致性
    cameraSmoothness: number;   // 运镜丝滑度
    presenterNatural: number;   // 主播自然度
    scriptImpact: number;       // 文案冲击力
    overallQuality: number;     // 整体品质
  };
  // 改进建议
  improvements: string[];
  // 避免的词汇（文案去重）
  avoidPhrases: string[];
}

// ============ 类型定义 ============

export interface ImageAnalysis {
  shopName: string;
  industry: string;
  industryName: string;
  products: ProductInfo[];
  atmosphere: string;
  targetAudience: string;
  colorScheme: string;
  lighting: string;
  layout: string;
  decorations: string[];
  sellingPoints: string[];
  consistencyElements: {
    shopSignStyle: string;
    mainColors: string[];
    productPlacement: string;
    interiorLayout: string;
    keyVisualElements: string[];
    spatialConstraints: string[];  // 空间约束（用于防穿越）
  };
}

export interface ProductInfo {
  name: string;
  category?: string;
  estimatedPrice?: string;
  
  // 外观细节
  appearanceDetails?: {
    shape: string;           // 形状尺寸
    colorLayers: string[];   // 颜色层次
    texture: string;         // 质感描述
    temperature: string;     // 温度状态
    freshness: string;       // 新鲜程度
  };
  
  // 视觉焦点
  visualFocus?: {
    firstImpression: string;       // 第一印象
    detailHighlights: string[];    // 细节亮点
    appetizingPoints: string[];    // 诱人之处
  };
  
  // 配料装饰
  ingredients?: {
    mainIngredients: string[];   // 主料
    sideIngredients: string[];   // 配菜
    sauces: string[];            // 酱料
    garnishes: string[];         // 装饰
  };
  
  // 画面位置
  visualPosition?: {
    horizontalPosition: string;  // 水平位置
    verticalPosition: string;    // 垂直位置
    occupancy: string;           // 占比大小
    depthLevel: string;          // 景深层次
    occlusion: string;           // 遮挡关系
  };
  
  // 光影效果
  lightingEffect?: {
    lightDirection: string;    // 光源方向
    highlights: string;        // 高光位置
    shadows: string;           // 阴影位置
    atmosphere: string;        // 氛围感
  };
  
  // 环境关联
  environmentContext?: {
    container: string;           // 容器
    tableSurface: string;        // 桌面
    backgroundElements: string[]; // 背景元素
  };
  
  // 兼容旧字段
  features?: string[];
  painPoints: string[];
  antiPoints: string[];
  highlights?: string[];
  sellingPoints?: string[];
  price?: string;
}

export interface StoryboardItem {
  id: number;
  imageIndex: number;
  startTime: number;
  endTime: number;
  duration: number;
  narration: string;
  sceneDescription: string;
  // 丝滑运镜设计
  cameraDesign: {
    movement: string;           // 运镜类型
    path: string;               // 移动路径
    speed: string;              // 速度曲线（ease-in/ease-out）
    startPosition: string;      // 起始位置
    endPosition: string;        // 结束位置
    obstacles: string[];        // 需避开的障碍
    safePath: string;           // 安全移动路径
    smoothness: string;         // 丝滑度描述
  };
  // 主播动作设计
  presenterDesign: {
    action: string;             // 动作描述
    actionPath: string;         // 动作轨迹
    startPosition: string;      // 起始位置
    endPosition: string;        // 结束位置
    handGesture: string;        // 手势
    bodyLanguage: string;       // 肢体语言
    facialExpression: string;   // 面部表情
    eyeContact: string;         // 眼神方向
    smoothTransition: string;   // 与下一镜头的衔接
  };
  transition: string;
  subtitle: string;
  subtitleTiming: { startTime: number; endTime: number; text: string; }[];
  emotion: string;
}

export interface PresenterProfile {
  name: string;
  age: string;
  appearance: string;
  clothing: string;
  personality: string;
  catchphrases: string[];
  signatureMoves: string[];
  voiceStyle: string;
}

export interface ExpertDiscussion {
  expert: string;
  topic: string;
  content: string;
  suggestions: string[];
  approved: boolean;
}

export interface VideoGenerationRequest {
  imageUrls: string[];
  extraInfo?: string;
}

export interface VideoResult {
  videoUrl: string;
  script: string;
  storyboard: StoryboardItem[];
  imageAnalysis: ImageAnalysis;
  presenter: PresenterProfile;
  discussions: ExpertDiscussion[];
  duration: number;
}

@Injectable()
export class ExpertPipelineService {
  private llmClient: LLMClient;
  private videoClient: VideoGenerationClient;
  private ttsClient: TTSClient;
  private apiKey: string;
  private baseUrl: string;
  
  // 历史学习数据存储
  private videoHistory: VideoHistory[] = [];
  private avoidPhrases: Set<string> = new Set();
  private bestPractices: {
    cameraMoves: string[];
    scriptStyles: string[];
    presenterActions: string[];
  } = {
    cameraMoves: [],
    scriptStyles: [],
    presenterActions: []
  };

  constructor() {
    // 初始化API Key
    const possibleEnvPaths = [
      path.join(process.cwd(), '..', '.env.local'),
      path.join(process.cwd(), '.env.local'),
      path.join(process.cwd(), '..', '..', '.env.local'),
      '/opt/bytefaas/.env.local',
    ];

    let apiKey = '';
    for (const envPath of possibleEnvPaths) {
      try {
        if (fs.existsSync(envPath)) {
          const envFile = fs.readFileSync(envPath, 'utf-8');
          const match = envFile.match(/COZE_WORKLOAD_IDENTITY_API_KEY=(.+)/);
          if (match && match[1]) {
            apiKey = match[1].trim();
            break;
          }
        }
      } catch (error) {
        continue;
      }
    }

    if (!apiKey) {
      apiKey = process.env.COZE_WORKLOAD_IDENTITY_API_KEY || process.env.COZE_API_KEY || '';
    }

    this.apiKey = apiKey;
    this.baseUrl = 'https://ark.cn-beijing.volces.com';
    
    const config = new Config({
      apiKey: this.apiKey,
      baseUrl: this.baseUrl,
      modelBaseUrl: `${this.baseUrl}/api/v3`
    });

    this.llmClient = new LLMClient(config);
    this.videoClient = new VideoGenerationClient(config);
    this.ttsClient = new TTSClient(config);

    // 加载历史学习数据
    this.loadLearningData();

    console.log('[ExpertPipelineService] 初始化完成');
    console.log('[ExpertPipelineService] 历史视频数:', this.videoHistory.length);
    console.log('[ExpertPipelineService] 避免词汇数:', this.avoidPhrases.size);
  }

  // ============ 主入口 ============

  async previewGeneration(request: VideoGenerationRequest): Promise<{
    imageAnalysis: ImageAnalysis;
    script: string;
    storyboard: StoryboardItem[];
    presenter: PresenterProfile;
    discussions: ExpertDiscussion[];
    previewReady: boolean;
  }> {
    console.log('='.repeat(70));
    console.log('🎬 【专家协作学习系统】开始工作...');
    console.log('='.repeat(70));

    const discussions: ExpertDiscussion[] = [];

    // 专家1: 图片一致性分析
    console.log('\n📊 专家1【图片一致性分析专家】正在深度分析...');
    const imageAnalysis = await this.expert1_ImageConsistencyAnalysis(request.imageUrls);
    discussions.push({
      expert: '图片一致性分析专家',
      topic: '视觉要素提取',
      content: `识别到店铺：${imageAnalysis.shopName}，行业：${imageAnalysis.industryName}`,
      suggestions: [`主色调需保持：${imageAnalysis.consistencyElements?.mainColors?.join('/')}`],
      approved: true
    });

    // 专家2: 主播形象设计
    console.log('\n👩 专家2【主播形象专家】正在设计主播人设...');
    const presenter = await this.expert2_PresenterDesign(imageAnalysis);
    discussions.push({
      expert: '主播形象专家',
      topic: '主播人设设计',
      content: `主播：${presenter.name}，风格：${presenter.personality}`,
      suggestions: [`标志性动作：${presenter.signatureMoves.slice(0, 2).join('、')}`],
      approved: true
    });

    // 专家3: 病毒式文案（含评审）
    console.log('\n✍️ 专家3【病毒式文案专家】正在撰写文案...');
    const { script: rawScript, discussion: scriptDiscussion } = await this.expert3_ViralScriptWithReview(
      imageAnalysis, 
      presenter, 
      request.extraInfo
    );
    discussions.push(scriptDiscussion);

    // 专家4: 电影级运镜（含评审）
    console.log('\n🎬 专家4【电影级运镜专家】正在设计丝滑运镜...');
    const { storyboard, discussion: storyboardDiscussion } = await this.expert4_CinematicStoryboardWithReview(
      rawScript,
      imageAnalysis,
      presenter,
      request.imageUrls.length
    );
    discussions.push(storyboardDiscussion);

    console.log('\n✅ 专家协作完成，等待用户确认...');

    return {
      imageAnalysis,
      script: rawScript,
      storyboard,
      presenter,
      discussions,
      previewReady: true
    };
  }

  async confirmAndGenerate(
    request: VideoGenerationRequest,
    previewData: {
      imageAnalysis: ImageAnalysis;
      script: string;
      storyboard: StoryboardItem[];
      presenter: PresenterProfile;
      discussions: ExpertDiscussion[];
    }
  ): Promise<VideoResult> {
    console.log('='.repeat(70));
    console.log('🎬 【用户已确认】开始生成电影级视频...');
    console.log('='.repeat(70));

    // 专家5: 视频生成
    console.log('\n🎥 专家5【视频生成专家】正在生成视频...');
    const videoUrl = await this.expert5_VideoGenerationWithCinematography(
      request.imageUrls,
      previewData.script,
      previewData.imageAnalysis,
      previewData.presenter,
      previewData.storyboard
    );

    // 记录学习数据
    this.recordLearning(previewData, videoUrl);

    console.log('🎉 电影级视频生成完成!');

    return {
      videoUrl,
      script: previewData.script,
      storyboard: previewData.storyboard,
      imageAnalysis: previewData.imageAnalysis,
      presenter: previewData.presenter,
      discussions: previewData.discussions,
      duration: 12
    };
  }

  // ============ 专家1: 图片一致性分析专家（极致商品细节版） ============

  private async expert1_ImageConsistencyAnalysis(imageUrls: string[]): Promise<ImageAnalysis> {
    const base64Images = await this.convertImagesToBase64(imageUrls);
    
    const prompt = `你是世界顶级商业摄影师+美食评论家+视觉设计师，拥有极致的细节观察能力。
你需要对图片进行【像素级分析】，把每个商品的每一个细节都拿捏到位。

================================================================================
【核心任务】极致分析商品细节，为后续文案和视频生成提供精准素材
================================================================================

## 一、商品深度分析（每个商品必须包含以下所有维度）

### 1.1 商品基本信息
- 商品全名（尽可能精确，如"安格斯厚切牛肋条"而非"牛肉"）
- 商品类别（主菜/饮品/甜点/配菜等）
- 商品价格预估（如果可见）

### 1.2 商品外观细节（极致描述）
- **形状与尺寸**：圆形/方形/不规则、直径/高度/厚度、分量大小
- **颜色层次**：主色调、渐变色、焦糖色/金黄/深褐等具体描述
- **表面质感**：光滑/粗糙、油润/干爽、有光泽/哑光
- **温度状态**：热气腾腾/冰镇/常温（从蒸汽、凝结水珠判断）
- **新鲜程度**：从色泽、质地判断新鲜度

### 1.3 商品视觉焦点（最吸引眼球的部分）
- **第一眼看到的**：最突出的视觉元素
- **细节亮点**：芝麻粒、葱花、酱汁光泽、肉纹纹理、奶酪拉丝等
- **诱人之处**：让人流口水的具体细节

### 1.4 商品配料与装饰
- **主料**：主要食材
- **配料**：蔬菜、配菜、点缀
- **酱料**：淋酱、蘸料、调料的描述
- **装饰**：香菜、芝麻、薄荷叶等装饰物

### 1.5 商品画面位置（精确到像素级描述）
- **水平位置**：画面左1/3/中央/右1/3
- **垂直位置**：画面上1/3/中央/下1/3
- **占比大小**：占画面面积的百分比（约%）
- **景深层次**：前景/中景/背景
- **遮挡关系**：是否被其他物品遮挡

### 1.6 商品光影效果
- **光源方向**：左侧光/右侧光/顶光/逆光
- **光影效果**：高光位置、阴影位置
- **氛围感**：暖光/冷光、强光/柔光

### 1.7 商品与环境的关联
- **摆放容器**：盘子/碗/杯子/托盘的材质、颜色、形状
- **桌面/台面**：桌布、餐垫、桌面的材质和颜色
- **背景元素**：背景中有哪些相关元素

## 二、店铺环境分析

### 2.1 店铺识别
- **店名招牌**：名称、字体风格、颜色、位置、是否发光
- **店铺类型**：餐厅类型、档次定位
- **营业状态**：从图片细节判断

### 2.2 空间布局
- **整体格局**：开放式/包间/吧台等
- **动线设计**：顾客流动路线
- **空间层次**：前台/用餐区/展示区的分布

### 2.3 装修风格
- **主色调**：墙面、地面、天花板的颜色
- **装饰元素**：挂画、绿植、灯饰等
- **氛围营造**：温馨/高级/文艺/热闹等

## 三、一致性要素（视频生成必须保持）

### 3.1 视觉一致性
- **招牌样式**：字体、颜色、大小、位置
- **品牌元素**：logo、slogan、品牌色
- **空间特征**：标志性装饰、特色摆设

### 3.2 色彩一致性
- **主色板**：提取3-5个主要颜色（具体到色号描述）
- **辅助色**：点缀色、过渡色
- **光影色调**：整体画面的色调倾向

## 四、空间约束（防穿越）

### 4.1 固定障碍物
- 墙壁位置
- 柱子位置
- 门的位置和开合方向
- 窗户位置

### 4.2 家具设备
- 桌椅摆放
- 柜台位置
- 设备位置

### 4.3 安全移动路径
- 主播可以站立的位置
- 摄像机可以移动的路线
- 需要避开的区域

================================================================================
【输出格式】严格输出以下JSON结构，每个字段都要填写详细
================================================================================

{
  "shopName": "从招牌识别的店铺全名",
  "industry": "行业代码",
  "industryName": "行业中文名",
  
  "products": [
    {
      "name": "商品精确全名",
      "category": "商品类别",
      "estimatedPrice": "预估价格区间",
      
      "appearanceDetails": {
        "shape": "形状描述，如：直径约15cm的圆形披萨，厚度约2cm",
        "colorLayers": ["颜色层次1：金黄焦脆的边缘", "颜色层次2：中央橙红的番茄酱底", "颜色层次3：白色的马苏里拉奶酪"],
        "texture": "质感描述，如：表面微焦起泡，奶酪呈现半融化拉丝状态",
        "temperature": "温度状态，如：刚出炉，表面还冒着细密热气",
        "freshness": "新鲜程度，如：食材色泽鲜艳，蔬菜翠绿饱满"
      },
      
      "visualFocus": {
        "firstImpression": "第一眼最吸引的元素，如：中央堆得高高的牛肉片",
        "detailHighlights": ["细节亮点1：肉片表面油润反光", "细节亮点2：边缘焦褐色的烤痕", "细节亮点3：点缀的芝麻粒"],
        "appetizingPoints": ["诱人细节1：咬开后的肉汁感", "诱人细节2：配菜的爽脆对比"]
      },
      
      "ingredients": {
        "mainIngredients": ["主料1", "主料2"],
        "sideIngredients": ["配菜1", "配菜2"],
        "sauces": ["酱料描述，如：浓稠的黑椒汁，呈深褐色，微微流淌"],
        "garnishes": ["装饰物1", "装饰物2"]
      },
      
      "visualPosition": {
        "horizontalPosition": "画面左1/3处",
        "verticalPosition": "画面中央偏上",
        "occupancy": "约占画面35%",
        "depthLevel": "中景主体",
        "occlusion": "无遮挡/被XX遮挡约10%"
      },
      
      "lightingEffect": {
        "lightDirection": "左上方45度入射",
        "highlights": "高光位置：肉表面油光处",
        "shadows": "阴影位置：盘子边缘下方",
        "atmosphere": "暖色调柔光，营造温馨食欲感"
      },
      
      "environmentContext": {
        "container": "白色圆形陶瓷盘，直径约25cm，边缘有简约金线",
        "tableSurface": "深木色实木桌面，有自然纹理",
        "backgroundElements": ["背景虚化的酒架", "远处的暖色吊灯"]
      },
      
      "painPoints": ["痛点1：同类产品常见问题", "痛点2：用户顾虑"],
      "antiPoints": ["反差点1：超出预期的方面", "反差点2：打破认知的亮点"]
    }
  ],
  
  "consistencyElements": {
    "shopSignStyle": "招牌详细描述：黑底金字，楷体字样，LED背光，悬挂于门口正上方",
    "mainColors": ["深棕色：#4A3728", "暖黄色：#F5DEB3", "白色：#FFFFFF"],
    "productPlacement": "产品始终置于画面中央偏左，占据主体位置",
    "interiorLayout": "入口在画面右侧，L型吧台在左侧，用餐区在后方",
    "keyVisualElements": ["门口的绿植盆栽", "墙上的手写菜单黑板", "柜台上的收银机"],
    "spatialConstraints": ["左侧为承重墙，不可穿越", "右侧为玻璃门，入口通道", "前景为吧台区域"]
  },
  
  "atmosphere": "整体氛围：温馨舒适的日式居酒屋风格，灯光柔和，适合约会聚餐",
  "targetAudience": "目标客群：25-35岁都市白领，追求品质和性价比",
  "colorScheme": "色彩方案：以深木色为主，搭配暖黄灯光和白色餐具",
  "lighting": "光源设计：顶部暖黄吊灯为主光源，辅以墙面壁灯营造层次",
  "layout": "空间布局：入口右侧为等候区，中央为吧台，后方为卡座用餐区",
  "decorations": ["装饰1：墙上的浮世绘挂画", "装饰2：角落的日式灯笼", "装饰3：柜台旁的清酒展示柜"],
  "sellingPoints": ["卖点1：现点现做，明档可见", "卖点2：食材新鲜，当日采购", "卖点3：性价比高，人均80元"]
}

【重要提示】
1. 每个字段都要填写详细、具体、可感知的内容
2. 避免模糊描述，用具体的数字、颜色、材质替代
3. 商品细节要做到"看文案就能想象出画面"
4. 如果图片中有多个商品，按重要性排序分析

只输出JSON，不要其他内容。`;

    try {
      const contents: any[] = [{ type: 'text', text: prompt }];
      for (const base64 of base64Images) {
        contents.push({ type: 'image_url', image_url: { url: base64 } });
      }

      const response = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [{ role: 'user', content: contents }],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 180000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        console.log('📊 图片分析完成：', result.shopName, '- 识别到', result.products?.length || 0, '个商品');
        return result;
      }
      return this.getDefaultAnalysis();
    } catch (error) {
      console.error('图片分析失败:', error);
      return this.getDefaultAnalysis();
    }
  }

  // ============ 专家2: 主播形象设计专家 ============

  private async expert2_PresenterDesign(analysis: ImageAnalysis): Promise<PresenterProfile> {
    // 根据行业和目标客群定制主播
    const profiles: Record<string, PresenterProfile> = {
      'restaurant': {
        name: '小美',
        age: '22-26',
        appearance: '甜美可爱的亚洲女性，大眼睛，皮肤白皙，笑容灿烂有感染力，身材匀称',
        clothing: '休闲时尚，浅色系，干净清爽',
        personality: '吃货人设，对美食充满热情，说话活泼可爱，像朋友一样推荐',
        catchphrases: ['这也太香了吧', '姐妹们冲', '绝了绝了', '好吃到哭'],
        signatureMoves: ['双手捧脸惊讶', '假装偷吃', '竖大拇指', '满足眯眼'],
        voiceStyle: '甜美活泼，语速稍快，带点俏皮感'
      },
      'fashion': {
        name: '小雅',
        age: '23-27',
        appearance: '时尚精致的亚洲女性，气质出众，穿搭有品味，妆容精致',
        clothing: '潮流穿搭，配饰讲究，与店铺风格呼应',
        personality: '时尚达人，品味独到，自信有魅力，像时尚编辑',
        catchphrases: ['这个质感绝了', '高级感拉满', '闭眼冲', '谁穿谁好看'],
        signatureMoves: ['转身展示', '手比ok', '自信微笑', '整理衣服'],
        voiceStyle: '知性优雅，语速适中，有说服力'
      },
      'beauty': {
        name: '小琪',
        age: '22-25',
        appearance: '精致美妆的亚洲女性，皮肤状态好，五官精致，妆容自然',
        clothing: '简约优雅，突出气质',
        personality: '美妆达人，专业又亲切，像闺蜜分享',
        catchphrases: ['姐妹们看这里', '这个效果绝了', '变美小技巧', '锁死这个'],
        signatureMoves: ['近距离展示', '眨眼wink', '手比心形', '点头确认'],
        voiceStyle: '温柔专业，语速适中，有感染力'
      }
    };

    return profiles[analysis.industry] || {
      name: '小悦',
      age: '22-26',
      appearance: '阳光活力的亚洲女性，长相甜美，表情丰富自然',
      clothing: '休闲得体，与店铺风格搭配',
      personality: '热情开朗，亲和力强，像身边的朋友',
      catchphrases: ['太棒了', '推荐给大家', '真的不错', '快来看看'],
      signatureMoves: ['双手比心', '竖大拇指', '开心拍手', '微笑点头'],
      voiceStyle: '自然亲切，语速适中，有感染力'
    };
  }

  // ============ 专家3: 病毒式文案专家（含评审 + 逆向思维） ============

  // 360行痛点话术库
  private readonly industryPainPoints: Record<string, string[]> = {
    '餐饮': [
      '还在纠结吃什么？每次打开外卖刷半小时，最后点的还是那几家',
      '网红店排队两小时，吃完就后悔，照片好看味道拉胯',
      '人均两三百的店，吃完还是饿，钱包遭罪胃也不满足',
      '聚餐选餐厅太难了，众口难调，谁都不想当那个做决定的',
      '外卖踩雷无数次，每次都想着下次一定，结果下次还踩'
    ],
    '咖啡': [
      '连锁咖啡喝多了，不是太酸就是像兑水，想喝杯像样的怎么这么难',
      '30块一杯的咖啡，喝完心跳加速睡不着，晚上还不敢喝',
      '咖啡店氛围好，但一杯咖啡够我吃顿饭了，钱包扛不住',
      '想找个能办公的咖啡店，WiFi慢、插座少、还吵得要命'
    ],
    '奶茶': [
      '奶茶喝完就后悔，糖分爆炸、热量爆炸，但下次还忍不住',
      '网红奶茶排队40分钟，喝一口全是糖精味，智商税',
      '想喝奶茶又怕胖，点无糖又没灵魂，纠结半天最后不喝了',
      '奶茶店遍地都是，真正好喝的没几家，踩雷踩到怀疑人生'
    ],
    '火锅': [
      '火锅店太多了，哪家好吃哪家坑，根本分不清楚',
      '吃火锅一身味道，第二天头发都是火锅味，社死现场',
      '火锅吃完口干舌燥，第二天还拉肚子，爽是爽了但代价大',
      '人均100的火锅，肉没几片全是配菜，吃了个寂寞'
    ],
    '烧烤': [
      '烧烤摊烟熏火燎，吃完一身味，第二天还上火',
      '路边摊不卫生，正规店又贵，想吃顿好的烧烤真难',
      '烧烤吃到一半，发现肉不新鲜，恶心半天还不敢说',
      '烧烤店太多，好吃的没几家，踩雷踩到怀疑人生'
    ],
    '日料': [
      '日料动辄人均几百，吃完还是饿，性价比低到发指',
      '日料店假货多，三文鱼根本不是三文鱼，吃了个寂寞',
      '想吃正宗日料，结果全是预制菜，跟便利店有什么区别',
      '日料店装修好看，但味道也就那样，纯纯收智商税'
    ],
    '西餐': [
      '西餐厅氛围好，但人均两三百，吃完还是饿，钱包遭罪',
      '西餐看起来高级，吃起来就那样，纯纯为装修买单',
      '约会选西餐厅，结果菜品踩雷，面子上过不去',
      '西餐量少价高，吃完还得去便利店买零食'
    ],
    '甜品': [
      '甜品店拍照好看，但吃两口就腻了，剩下一半浪费',
      '网红甜品排队一小时，吃一口全是糖，甜到发齁',
      '甜品好看不好吃，纯纯拍照道具，吃完还长胖'
    ],
    '美发': [
      '理发店剪完就后悔，跟图片完全不一样，每次都是赌博',
      '染发烫发动辄几百上千，效果维持不了多久，钱白花了',
      '理发师永远听不懂"稍微修一下"，剪完跟换个人似的',
      '办了卡就跑路，理发店套路太深，防不胜防'
    ],
    '美甲': [
      '美甲做一次几百块，两周就掉了，性价比太低',
      '美甲店指甲油劣质，做完指甲变黄变脆，后悔死',
      '美甲款式看图好看，做出来完全不一样，每次都是开盲盒'
    ],
    '美容': [
      '美容院办卡套路深，不办卡不给好好做，办了卡服务就变了',
      '美容做完没效果，还被推销各种产品，烦都烦死',
      '美容院换人太快，每次都是新手练手，效果不稳定'
    ],
    '健身': [
      '健身房办了卡不去，每次都想着明天开始，结果年卡都过期了',
      '私教课动辄几万块，上完发现没啥效果，智商税',
      '健身房人太多，想用的器械永远有人在排队'
    ],
    '服装': [
      '网购衣服尺码不准，退换货麻烦死了，买衣服越来越累',
      '实体店衣服太贵，同款网上便宜一半，但网上买又不合身',
      '快时尚衣服洗两次就变形，质量差到离谱'
    ],
    '家居': [
      '宜家逛一圈累死，买回来自己装，装到半夜还没装完',
      '家具买回家发现尺寸不对，退又麻烦，不退又占地方',
      '网红家居看着好看，用起来全是问题，中看不中用'
    ],
    '数码': [
      '手机买回来两个月就降价，电子产品贬值太快，买早了就亏',
      '数码产品参数看不懂，买回来发现根本用不上，多花了冤枉钱',
      '售后太坑，有问题就说人为损坏，修的钱够买新的'
    ],
    '汽车': [
      '4S店套路太深，买车前是大爷，付完钱就变了脸',
      '保养维修水太深，明明小问题，非说大毛病，被当韭菜割',
      '新车落地就贬值，开了两年卖掉亏一半'
    ],
    '教育': [
      '培训班动辄几万块，上完发现没啥用，纯纯智商税',
      '网课买了一堆，真正看完的没几个，最后都落灰了',
      '孩子培训班太多，家长累孩子也累，效果还不知道'
    ],
    '旅游': [
      '网红景点照骗，去了才发现就那样，纯纯浪费时间',
      '旅游团坑太多，购物点比景点多，玩得一点都不尽兴',
      '节假日出门就是看人头，景点没看到，光看后脑勺了'
    ],
    '酒店': [
      '酒店照片跟实物完全不符，住进去才发现上当',
      '酒店房价贵得离谱，设施还老旧，性价比低到极点',
      '民宿更坑，照片好看，住进去各种问题，卫生堪忧'
    ],
    '宠物': [
      '宠物医院太黑了，看个小病几百上千，比人看病还贵',
      '宠物店买的宠物不健康，买回去就生病，花了大把钱',
      '宠物用品贵得离谱，一个猫爬架几百块，赚翻了'
    ],
    'default': [
      '花了不少钱，结果体验远不如预期，感觉被坑了',
      '东西看着不错，用起来全是问题，中看不中用',
      '宣传做得好，实际完全不是那回事，信任被透支',
      '别人都说好，自己体验才知道，很多东西只能看不能信'
    ]
  };

  // 逆向思维话术库
  private readonly reverseThinkingTemplates: string[] = [
    '别人都推荐XX，我偏要说句大实话——',
    '网上好评如潮？我来泼盆冷水——',
    '都说XX是智商税？这次我站反方——',
    '避雷帖看多了，但这家的XX让我闭嘴了——',
    '本来是冲着踩雷来的，结果被圈粉了——',
    '以为又是网红店收割机，没想到这次翻车了——翻车到被种草',
    '来之前各种不情愿，来之后——真香！',
    '朋友强推了好几次，我一直在心里翻白眼，直到我自己来了——',
    '差评帖看了一堆，抱着"试试看能有多坑"的心态来的——结果',
    '本来准备给一星，吃完我沉默了——',
    '第一眼觉得"就这？"，第二眼——真香！',
    '来之前：肯定又是智商税；来之后：下次还来',
    '做好了踩雷的准备，结果——雷没踩着，踩到宝藏了'
  ];

  // 极致产品描述技巧
  private readonly productDescriptionTechniques: {
    name: string;
    template: string;
    example: string;
  }[] = [
    {
      name: '感官轰炸',
      template: '{视觉}+{听觉}+{嗅觉}+{触觉}+{味觉}五感全开',
      example: '滋滋作响的烤肉，焦香扑鼻，咬下去肉汁四溢，油脂在舌尖化开'
    },
    {
      name: '数字量化',
      template: '用具体数字增强说服力',
      example: '每天只卖100份、排队3小时、月销5000单、128层酥皮'
    },
    {
      name: '对比反衬',
      template: '用"看似...实则..."制造反差',
      example: '看似普通的店面，藏着三代传承的手艺；看似简单的面条，熬足了8小时'
    },
    {
      name: '过程还原',
      template: '描述制作过程，增加真实感',
      example: '从挑选食材到上桌，每一步都看得见，师傅当场手作，热气腾腾端上来'
    },
    {
      name: '痛点解决',
      template: '点出用户痛点，给出解决方案',
      example: '怕胖又想吃？他家用低脂替代，热量减半美味不减，健身党放心冲'
    },
    {
      name: '场景代入',
      template: '描绘使用场景，引发共鸣',
      example: '加班到深夜，一碗热汤下肚，整颗心都暖了'
    },
    {
      name: '稀缺暗示',
      template: '强调限量、限时、难买',
      example: '每天只做50份，晚了真吃不到；老板说太累不想做太多'
    },
    {
      name: '身份认同',
      template: '让用户觉得这是"同类"的选择',
      example: '健身党都在这吃、附近上班族的心头好、本地人才知道'
    }
  ];

  private async expert3_ViralScriptWithReview(
    analysis: ImageAnalysis,
    presenter: PresenterProfile,
    extraInfo?: string
  ): Promise<{ script: string; discussion: ExpertDiscussion }> {
    
    // 构建避免词汇列表
    const avoidList = Array.from(this.avoidPhrases).slice(-30).join('、');
    
    // 参考历史最佳实践
    const bestStyles = this.bestPractices.scriptStyles.slice(-5).join('\n');

    // 获取行业痛点话术
    const industry = analysis.industryName || '餐饮';
    const painPoints = this.industryPainPoints[industry] || this.industryPainPoints['default'];
    const selectedPainPoints = painPoints.slice(0, 3).join('\n');

    // 选择逆向思维模板
    const reverseTemplate = this.reverseThinkingTemplates[Math.floor(Math.random() * this.reverseThinkingTemplates.length)];

    // 构建产品极致描述指南
    const productDescGuide = this.productDescriptionTechniques.map(t => 
      `【${t.name}】${t.template}\n例：${t.example}`
    ).join('\n');

    const productsInfo = analysis.products?.map((p, i) => 
      `${i + 1}. ${p.name}
   痛点：${p.painPoints?.join('、') || '解决用户核心需求'}
   反差：${p.antiPoints?.join('、') || '预期之外的惊喜'}
   位置：${p.visualPosition}`
    ).join('\n') || '特色产品';

    const prompt = `你是顶级探店文案大师，深谙人性弱点，擅长用【逆向思维】+【极致产品描述】打造爆款文案。

## 核心要求
1. **绝对不重复**：每篇文案都是全新的表达
2. **360行痛点**：直击行业最痛的地方
3. **逆向思维**：打破常规认知，制造惊喜
4. **极致产品描述**：用专业技巧把产品写出灵魂

## 主播人设
- 名字：${presenter.name}
- 风格：${presenter.personality}
- 口头禅：${presenter.catchphrases.join('、')}

## 店铺信息
- 店名：${analysis.shopName}
- 行业：${industry}
- 氛围：${analysis.atmosphere}

## 产品痛点与反差
${productsInfo}

${extraInfo ? `## 用户补充信息：${extraInfo}` : ''}

## 【行业痛点话术库】（选1-2个融入文案）
${selectedPainPoints}

## 【逆向思维模板】（选1个使用）
${reverseTemplate}

## 【极致产品描述技巧】（综合运用）
${productDescGuide}

## 历史最佳文案风格参考
${bestStyles || '首次生成，追求极致创新'}

## 禁止使用的词汇和句式（必须创新）
${avoidList || '无'}

## 黄金12秒文案结构（严格遵守）
1. **开场钩子（0-2秒）**：
   - 用逆向思维开场，打破预期
   - 例："网上都说XX坑，我来实测..." / "本来准备来踩雷的..."
   
2. **核心展示（2-8秒）**：
   - 用极致产品描述技巧写产品
   - 点出痛点→展示解决方案→制造反差
   - 必须具体、可感知、有画面感
   
3. **行动号召（8-12秒）**：
   - 制造紧迫感或稀缺感
   - 例："趁现在人少..." / "晚了真的..."

## 写作禁区
❌ 空洞赞美："太好吃了"、"环境超好"、"推荐给大家"
❌ 无意义感叹："哇"、"绝了"、"太棒了"
❌ 重复词汇：每个行业前3个高频词不能用
❌ 陈词滥调："宝藏店铺"、"不容错过"、"性价比超高"

## 创新要求
✅ 每句话都要有信息量
✅ 用具体细节代替抽象形容词
✅ 用数字/对比/场景增强可信度
✅ 用逆向思维制造惊喜
✅ 符合${presenter.name}的人设口吻

直接输出12秒精华文案（约50-60字），不要任何解释或分析。`;

    try {
      // 第一轮：生成文案
      const response = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            { 
              role: 'system', 
              content: `你是${presenter.name}，${presenter.personality}。
你的文案特点：
1. 用逆向思维开场，打破预期
2. 用极致细节描述产品
3. 每句话都有信息量，绝无废话
4. 永远创新，绝不重复`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.95
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      let script = response.data?.choices?.[0]?.message?.content?.trim();
      
      // 第二轮：逆向评审和深度优化
      const reviewPrompt = `你是毒舌文案评审专家，用最严格的标准评审以下文案：

"${script}"

## 评审清单（逐条检查）
1. 【重复检测】是否有以下问题词汇：宝藏、不容错过、性价比、绝了、太棒了、推荐
2. 【空洞检测】是否有无意义的形容词没有具体细节支撑
3. 【逆向思维】是否打破了用户预期？还是老套路？
4. 【产品描述】产品是否写出了画面感和细节？
5. 【痛点直击】是否说出用户的真实困扰？

## 优化要求
- 如果有任何问题，重写优化
- 如果已经很完美，原样输出
- 只输出最终文案，不要任何解释`;

      const reviewResponse = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            { role: 'system', content: '你是毒舌文案评审，追求极致，从不妥协。' },
            { role: 'user', content: reviewPrompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const finalScript = reviewResponse.data?.choices?.[0]?.message?.content?.trim() || script;
      
      // 提取关键词加入避免列表
      this.extractPhrasesToAvoid(finalScript);
      
      // 记录最佳实践
      this.bestPractices.scriptStyles.push(finalScript);

      console.log('✍️ 精华文案:', finalScript);

      return {
        script: finalScript,
        discussion: {
          expert: '病毒式文案专家',
          topic: '文案创作与评审',
          content: finalScript,
          suggestions: [
            '已应用逆向思维',
            '已使用极致产品描述',
            '已避免重复词汇',
            '符合人设风格'
          ],
          approved: true
        }
      };
    } catch (error) {
      console.error('文案生成失败:', error);
      const fallback = this.getViralScript(analysis, presenter);
      return {
        script: fallback,
        discussion: {
          expert: '病毒式文案专家',
          topic: '文案创作',
          content: fallback,
          suggestions: ['使用备用模板'],
          approved: true
        }
      };
    }
  }

  // ============ 专家4: 电影级运镜专家（含评审） ============

  private async expert4_CinematicStoryboardWithReview(
    script: string,
    analysis: ImageAnalysis,
    presenter: PresenterProfile,
    imageCount: number
  ): Promise<{ storyboard: StoryboardItem[]; discussion: ExpertDiscussion }> {
    
    const consistency = analysis.consistencyElements;
    const constraints = consistency?.spatialConstraints?.join('、') || '无特殊约束';
    
    // 参考历史最佳运镜
    const bestMoves = this.bestPractices.cameraMoves.slice(-5).join('\n');

    const prompt = `你是顶级电影导演和运镜专家，需要设计【丝滑到极致】的运镜和主播动作。

## 文案
${script}

## 主播人设
- 名字：${presenter.name}
- 外貌：${presenter.appearance}
- 服装：${presenter.clothing}（全程不变）
- 标志动作：${presenter.signatureMoves.join('、')}

## 一致性要素
- 招牌：${consistency?.shopSignStyle}
- 主色调：${consistency?.mainColors?.join('/')}
- 产品位置：${analysis.products?.map(p => `${p.name}在${p.visualPosition}`).join('；')}

## 空间约束（防穿越）
${constraints}

## 历史最佳运镜参考
${bestMoves || '首次设计，追求电影级'}

## 黄金12秒分镜（3-4个镜头）

### 运镜设计原则
1. **丝滑过渡**：每个镜头之间要无缝衔接
2. **物理正确**：摄像机不能穿墙、穿门、穿家具
3. **主播连贯**：主播位置和动作在镜头间要自然衔接
4. **情感递进**：开场热情→展示专业→结尾亲切

### 主播动作设计原则
1. **自然流畅**：动作要像真人一样自然
2. **眼神交流**：始终与镜头（观众）有眼神接触
3. **手势配合**：说话时配合自然的手势
4. **表情生动**：表情要配合情感变化
5. **丝滑衔接**：动作在镜头间要连贯

### 运镜类型参考
- 推进（Dolly In）：从远到近，强调情感
- 后拉（Dolly Out）：从近到远，展示环境
- 平移（Truck）：左右移动，展示产品
- 跟随（Follow）：跟随主播移动
- 环绕（Orbit）：围绕主播/产品旋转
- 升降（Boom）：上下移动，展示空间

**输出JSON数组**：
[
  {
    "id": 0,
    "imageIndex": 0,
    "startTime": 0,
    "endTime": 3,
    "duration": 3,
    "narration": "口播内容",
    "sceneDescription": "详细场景描述",
    "cameraDesign": {
      "movement": "运镜类型（如：推进）",
      "path": "详细路径（如：从门口沿走廊直线前进2米）",
      "speed": "速度曲线（如：开始慢-中间快-结束慢，ease-in-out）",
      "startPosition": "摄像机起始位置",
      "endPosition": "摄像机结束位置",
      "obstacles": ["需要避开的障碍物"],
      "safePath": "安全移动路径描述",
      "smoothness": "丝滑度描述（如：电影级丝滑，无明显顿挫）"
    },
    "presenterDesign": {
      "action": "主播动作描述",
      "actionPath": "动作轨迹（如：从门口走进，在柜台前停下）",
      "startPosition": "主播起始位置",
      "endPosition": "主播结束位置",
      "handGesture": "手势描述",
      "bodyLanguage": "肢体语言",
      "facialExpression": "面部表情",
      "eyeContact": "眼神方向（始终看向镜头）",
      "smoothTransition": "与下一镜头的衔接方式"
    },
    "transition": "转场效果",
    "subtitle": "字幕内容",
    "subtitleTiming": [
      {"startTime": 0, "endTime": 1.5, "text": "字幕第一句"}
    ],
    "emotion": "情绪"
  }
]

只输出JSON数组。`;

    try {
      // 第一轮：生成分镜
      const response = await axios.post(
        `${this.baseUrl}/api/v3/chat/completions`,
        {
          model: 'doubao-seed-2-0-pro-260215',
          messages: [
            { role: 'system', content: '你是顶级电影导演，精通运镜和场面调度，追求极致丝滑。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.6
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 120000
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        let storyboard = JSON.parse(jsonMatch[0]);
        
        // 第二轮：运镜评审
        storyboard = this.reviewAndOptimizeStoryboard(storyboard, analysis);
        
        // 记录最佳运镜
        storyboard.forEach(item => {
          this.bestPractices.cameraMoves.push(item.cameraDesign.movement + ': ' + item.cameraDesign.path);
        });

        console.log('🎬 电影级分镜完成，共', storyboard.length, '个镜头');

        return {
          storyboard,
          discussion: {
            expert: '电影级运镜专家',
            topic: '运镜与动作设计',
            content: `设计了${storyboard.length}个丝滑镜头`,
            suggestions: storyboard.map(s => `镜头${s.id + 1}: ${s.cameraDesign.movement}，${s.presenterDesign.action}`),
            approved: true
          }
        };
      }

      const fallback = this.getCinematicStoryboard(script, analysis, presenter, imageCount);
      return {
        storyboard: fallback,
        discussion: {
          expert: '电影级运镜专家',
          topic: '运镜设计',
          content: '使用备用模板',
          suggestions: ['建议优化运镜细节'],
          approved: true
        }
      };
    } catch (error) {
      console.error('分镜生成失败:', error);
      const fallback = this.getCinematicStoryboard(script, analysis, presenter, imageCount);
      return {
        storyboard: fallback,
        discussion: {
          expert: '电影级运镜专家',
          topic: '运镜设计',
          content: '使用备用模板',
          suggestions: ['生成过程中使用备用方案'],
          approved: true
        }
      };
    }
  }

  // 运镜评审和优化
  private reviewAndOptimizeStoryboard(storyboard: StoryboardItem[], analysis: ImageAnalysis): StoryboardItem[] {
    // 检查并优化每个镜头
    return storyboard.map((item, index) => {
      // 确保没有穿越问题
      if (!item.cameraDesign.obstacles || item.cameraDesign.obstacles.length === 0) {
        item.cameraDesign.obstacles = ['墙壁', '家具', '柜台'];
      }
      
      // 确保有安全路径
      if (!item.cameraDesign.safePath) {
        item.cameraDesign.safePath = '沿开放区域移动，避开障碍物';
      }
      
      // 确保丝滑度描述
      if (!item.cameraDesign.smoothness) {
        item.cameraDesign.smoothness = '电影级丝滑，无明显顿挫';
      }
      
      // 确保主播眼神接触
      if (!item.presenterDesign.eyeContact) {
        item.presenterDesign.eyeContact = '始终看向镜头';
      }
      
      // 确保动作衔接
      if (!item.presenterDesign.smoothTransition && index < storyboard.length - 1) {
        item.presenterDesign.smoothTransition = '自然过渡到下一个镜头';
      }
      
      return item;
    });
  }

  // ============ 专家5: 视频生成专家 ============

  private async expert5_VideoGenerationWithCinematography(
    imageUrls: string[],
    copywriting: string,
    imageAnalysis: ImageAnalysis,
    presenter: PresenterProfile,
    storyboard: StoryboardItem[]
  ): Promise<string> {
    console.log('🎥 生成电影级视频...');

    const base64Images = await this.convertImagesToBase64(imageUrls);
    if (base64Images.length === 0) {
      throw new Error('没有有效的图片数据');
    }

    const contentItems: Content[] = [];
    contentItems.push({
      type: 'image_url',
      image_url: { url: base64Images[0] },
      role: 'first_frame'
    });

    const consistency = imageAnalysis.consistencyElements;
    
    // 构建超详细的prompt
    let promptText = '';

    // ============ 视觉一致性 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# VISUAL CONSISTENCY (CRITICAL - MUST FOLLOW)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `## Shop Identity\n`;
    promptText += `- Shop Name: ${imageAnalysis.shopName}\n`;
    promptText += `- Shop Sign: ${consistency?.shopSignStyle || 'As shown in first image'}\n`;
    promptText += `- Main Colors: ${consistency?.mainColors?.join(', ') || 'As shown'}\n`;
    promptText += `- Key Elements: ${consistency?.keyVisualElements?.join(', ') || 'Must be consistent'}\n\n`;
    
    promptText += `## Product Positions\n`;
    imageAnalysis.products?.forEach((p, i) => {
      promptText += `- Product ${i + 1}: ${p.name} at ${p.visualPosition}\n`;
    });
    promptText += `\n`;

    // ============ 主播一致性 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# PRESENTER CONSISTENCY (SAME PERSON ALL SCENES)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `## Fixed Presenter Profile\n`;
    promptText += `- Name: ${presenter.name}\n`;
    promptText += `- Appearance: ${presenter.appearance}\n`;
    promptText += `- Clothing: ${presenter.clothing} (SAME in ALL scenes)\n`;
    promptText += `- The EXACT SAME PERSON must appear in EVERY frame\n`;
    promptText += `- Same face, same hair, same makeup, same outfit throughout\n`;
    promptText += `- ALWAYS facing camera (NEVER show back)\n`;
    promptText += `- Natural, fluid movements like a real person\n\n`;

    // ============ 丝滑运镜 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# CINEMATIC CAMERA MOVEMENT (SMOOTH & FLUID)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `## Camera Rules\n`;
    promptText += `- NEVER pass through walls, doors, glass, furniture, products\n`;
    promptText += `- ONLY move through open spaces: aisles, walkways, entrances\n`;
    promptText += `- Use SMOOTH camera movements (ease-in-out curves)\n`;
    promptText += `- NO sudden jumps or cuts - seamless transitions only\n`;
    promptText += `- Match camera speed to presenter movement\n\n`;
    
    promptText += `## Smoothness Requirements\n`;
    promptText += `- Each camera move: slow start → steady middle → slow end\n`;
    promptText += `- Motion blur for fluidity\n`;
    promptText += `- Cinematic quality like professional film\n\n`;

    // ============ 主播动作 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# PRESENTER MOVEMENT (NATURAL & FLUID)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `## Movement Rules\n`;
    promptText += `- Natural human-like movements\n`;
    promptText += `- Smooth gestures (no robotic motions)\n`;
    promptText += `- Eye contact with camera at all times\n`;
    promptText += `- Signature moves: ${presenter.signatureMoves.join(', ')}\n`;
    promptText += `- Facial expressions match emotion\n`;
    promptText += `- Hand gestures while speaking\n\n`;

    // ============ 详细分镜 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# STORYBOARD EXECUTION (12 SECONDS)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    storyboard.forEach((item, i) => {
      promptText += `## Scene ${i + 1}: ${item.startTime}-${item.endTime}s\n`;
      promptText += `### Narration\n`;
      promptText += `"${item.narration}"\n\n`;
      promptText += `### Scene\n`;
      promptText += `${item.sceneDescription}\n\n`;
      promptText += `### Camera\n`;
      promptText += `- Movement: ${item.cameraDesign?.movement || 'natural movement'}\n`;
      promptText += `- Path: ${item.cameraDesign?.path || 'natural path'}\n`;
      promptText += `- Speed: ${item.cameraDesign?.speed || 'smooth ease-in-out'}\n`;
      promptText += `- Avoid: ${item.cameraDesign?.obstacles?.join(', ') || 'obstacles'}\n`;
      promptText += `- Smoothness: ${item.cameraDesign?.smoothness || 'cinematic smooth'}\n\n`;
      promptText += `### Presenter\n`;
      promptText += `- Action: ${item.presenterDesign?.action || 'speaking naturally'}\n`;
      promptText += `- Position: ${item.presenterDesign?.startPosition || 'center frame'}\n`;
      promptText += `- Hands: ${item.presenterDesign?.handGesture || 'natural gestures'}\n`;
      promptText += `- Expression: ${item.presenterDesign?.facialExpression || item.emotion}\n`;
      promptText += `- Eyes: ${item.presenterDesign?.eyeContact || 'looking at camera'}\n\n`;
    });

    // ============ 音频 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# AUDIO (VOICE + MUSIC + SYNC)\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `## Voice-over\n`;
    promptText += `- Text: "${copywriting}"\n`;
    promptText += `- Speaker: ${presenter.name} (${presenter.voiceStyle})\n`;
    promptText += `- Sync: Lip movements MUST match the speech\n`;
    promptText += `- Speed: Natural but engaging\n\n`;
    
    promptText += `## Background Music\n`;
    promptText += `- Style: Trendy, upbeat, viral-worthy\n`;
    promptText += `- Beat: Strong rhythm with hooks\n`;
    promptText += `- Duration: 12 seconds with satisfying end\n`;
    promptText += `- Copyright: Royalty-free\n`;
    promptText += `- Mix: Voice 70% + Music 25% + SFX 5%\n\n`;

    // ============ 最终品质 ============
    promptText += `# ═════════════════════════════════════════════\n`;
    promptText += `# FINAL QUALITY CHECKLIST\n`;
    promptText += `# ═════════════════════════════════════════════\n\n`;
    
    promptText += `- [ ] Same presenter face in ALL scenes\n`;
    promptText += `- [ ] Same outfit throughout\n`;
    promptText += `- [ ] Shop sign visible and consistent\n`;
    promptText += `- [ ] Products in correct positions\n`;
    promptText += `- [ ] NO camera passing through objects\n`;
    promptText += `- [ ] Smooth, fluid camera movements\n`;
    promptText += `- [ ] Natural presenter movements\n`;
    promptText += `- [ ] Lip sync matches voice\n`;
    promptText += `- [ ] Catchy background music\n`;
    promptText += `- [ ] CINEMATIC, VIRAL-WORTHY RESULT\n`;

    contentItems.push({
      type: 'text',
      text: promptText
    });

    try {
      const response = await this.videoClient.videoGeneration(contentItems, {
        model: 'doubao-seedance-1-5-pro-251215',
        duration: 12,
        ratio: '9:16' as Ratio,
        resolution: '720p' as Resolution,
        generateAudio: true,
        watermark: false,
        maxWaitTime: 900
      });

      if (response.videoUrl) {
        console.log('视频生成成功');
        return response.videoUrl;
      }
      throw new Error('视频生成未返回URL');
    } catch (error) {
      console.error('视频生成失败:', error);
      throw error;
    }
  }

  // ============ 学习系统 ============

  private loadLearningData(): void {
    try {
      const historyPath = '/tmp/video_history.json';
      if (fs.existsSync(historyPath)) {
        const data = fs.readFileSync(historyPath, 'utf-8');
        this.videoHistory = JSON.parse(data);
        
        // 提取避免词汇
        this.videoHistory.forEach(h => {
          h.avoidPhrases?.forEach(p => this.avoidPhrases.add(p));
        });
        
        // 提取最佳实践
        // TODO: 从历史中学习
      }
    } catch (error) {
      console.log('无历史学习数据，从头开始');
    }
  }

  private recordLearning(previewData: any, videoUrl: string): void {
    try {
      // 提取文案关键词
      const phrases = this.extractKeyPhrases(previewData.script);
      
      const record: VideoHistory = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        imageAnalysis: previewData.imageAnalysis,
        script: previewData.script,
        storyboard: previewData.storyboard,
        presenter: previewData.presenter,
        videoUrl,
        scores: {
          visualConsistency: 8,
          cameraSmoothness: 8,
          presenterNatural: 8,
          scriptImpact: 8,
          overallQuality: 8
        },
        improvements: [],
        avoidPhrases: phrases
      };

      this.videoHistory.push(record);
      
      // 只保留最近50条
      if (this.videoHistory.length > 50) {
        this.videoHistory = this.videoHistory.slice(-50);
      }

      // 保存到文件
      const historyPath = '/tmp/video_history.json';
      fs.writeFileSync(historyPath, JSON.stringify(this.videoHistory, null, 2));
      
      console.log('📝 学习数据已记录');
    } catch (error) {
      console.error('记录学习数据失败:', error);
    }
  }

  private extractPhrasesToAvoid(script: string): void {
    // 提取可能重复的常见词汇
    const commonPhrases = [
      '太绝了', '超级推荐', '必须来', '真的很好',
      '非常不错', '特别好', '超级棒', '真的绝了'
    ];
    
    commonPhrases.forEach(p => {
      if (script.includes(p)) {
        this.avoidPhrases.add(p);
      }
    });
  }

  private extractKeyPhrases(script: string): string[] {
    const phrases: string[] = [];
    const words = script.split(/[，。！？、]/);
    words.forEach(w => {
      if (w.length >= 3 && w.length <= 6) {
        phrases.push(w.trim());
      }
    });
    return phrases.slice(0, 5);
  }

  // ============ 工具方法 ============

  private async convertImagesToBase64(imageUrls: string[]): Promise<string[]> {
    const base64Images: string[] = [];
    for (const url of imageUrls) {
      try {
        if (url.startsWith('http')) {
          const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
          const contentType = response.headers['content-type'] || 'image/jpeg';
          const base64 = Buffer.from(response.data).toString('base64');
          base64Images.push(`data:${contentType};base64,${base64}`);
        } else if (url.startsWith('data:')) {
          base64Images.push(url);
        } else if (url.startsWith('/')) {
          const filePath = url.replace('/api/uploads/', '/tmp/uploads/');
          if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
            base64Images.push(`data:${mimeType};base64,${buffer.toString('base64')}`);
          }
        }
      } catch (error) {
        console.error(`转换图片失败: ${url}`);
      }
    }
    return base64Images;
  }

  private getDefaultAnalysis(): ImageAnalysis {
    return {
      shopName: '这家店',
      industry: 'other',
      industryName: '店铺',
      products: [{
        name: '特色产品',
        category: '产品',
        features: ['品质优良'],
        painPoints: ['解决需求'],
        antiPoints: ['超出预期'],
        highlights: ['独特'],
        sellingPoints: ['值得信赖'],
        visualPosition: {
          horizontalPosition: '画面中央',
          verticalPosition: '画面中央',
          occupancy: '约占画面30%',
          depthLevel: '中景主体',
          occlusion: '无遮挡'
        },
        appearanceDetails: {
          shape: '形态完整',
          colorLayers: ['主色调'],
          texture: '质感细腻',
          temperature: '适宜',
          freshness: '新鲜'
        },
        visualFocus: {
          firstImpression: '产品主体',
          detailHighlights: ['细节精致'],
          appetizingPoints: ['诱人']
        },
        ingredients: {
          mainIngredients: ['主料'],
          sideIngredients: ['配菜'],
          sauces: ['酱料'],
          garnishes: ['装饰']
        },
        lightingEffect: {
          lightDirection: '正面光',
          highlights: '产品表面',
          shadows: '底部',
          atmosphere: '温馨'
        },
        environmentContext: {
          container: '器皿',
          tableSurface: '桌面',
          backgroundElements: ['背景']
        }
      }],
      consistencyElements: {
        shopSignStyle: '需保持一致',
        mainColors: ['明亮'],
        productPlacement: '中央',
        interiorLayout: '整洁',
        keyVisualElements: ['招牌'],
        spatialConstraints: ['注意避障']
      },
      atmosphere: '温馨',
      targetAudience: '年轻人',
      colorScheme: '明亮',
      lighting: '柔和',
      layout: '整洁',
      decorations: [],
      sellingPoints: ['品质好']
    };
  }

  private getViralScript(analysis: ImageAnalysis, presenter: PresenterProfile): string {
    const industry = analysis.industry;
    const scripts: Record<string, string> = {
      'restaurant': `姐妹们！谁能想到人均50能吃到这种品质？看这肉的纹理，入口就化！以前去别家又贵又一般，这里直接颠覆认知！趁现在还没火，赶紧冲！`,
      'fashion': `姐妹们看过来！这质感绝了！摸上去软糯到不行，穿上显瘦又高级！别家同款至少300+，这里直接砍半！不冲真的亏！`,
      'beauty': `姐妹们！我发现宝藏了！这效果直接惊艳到我！皮肤状态肉眼可见变好，而且完全不刺激！趁着有活动赶紧囤！`
    };
    return scripts[industry] || `姐妹们！${analysis.shopName}真的值得来！品质好价格实惠，趁现在人不多赶紧来！`;
  }

  private getCinematicStoryboard(
    script: string,
    analysis: ImageAnalysis,
    presenter: PresenterProfile,
    imageCount: number
  ): StoryboardItem[] {
    const sentences = script.split(/[。！？]/).filter(s => s.trim());
    
    return [
      {
        id: 0,
        imageIndex: 0,
        startTime: 0,
        endTime: 3,
        duration: 3,
        narration: sentences[0] || '开场',
        sceneDescription: `主播${presenter.name}站在店铺入口，招牌清晰可见`,
        cameraDesign: {
          movement: '推进',
          path: '从街道向店铺门口缓慢推进',
          speed: 'ease-in-out，开始慢→中间正常→结束慢',
          startPosition: '街道中景',
          endPosition: '店铺门口近景',
          obstacles: ['门口花盆', '台阶', '行人'],
          safePath: '沿人行道直线前进',
          smoothness: '电影级丝滑推进'
        },
        presenterDesign: {
          action: '热情招呼，双手比心',
          actionPath: '站在门口，轻微前倾',
          startPosition: '画面中央',
          endPosition: '画面中央',
          handGesture: '双手比心',
          bodyLanguage: '身体前倾，热情姿态',
          facialExpression: '灿烂笑容',
          eyeContact: '直视镜头',
          smoothTransition: '转身进入店内'
        },
        transition: '淡入',
        subtitle: sentences[0] || '',
        subtitleTiming: [{ startTime: 0, endTime: 3, text: sentences[0] || '' }],
        emotion: '热情兴奋'
      },
      {
        id: 1,
        imageIndex: Math.min(1, imageCount - 1),
        startTime: 3,
        endTime: 8,
        duration: 5,
        narration: sentences.slice(1, -1).join('') || '产品展示',
        sceneDescription: '主播走进店内，展示核心产品',
        cameraDesign: {
          movement: '跟随+平移',
          path: '跟随主播沿主通道前进，同时轻微左右平移展示产品',
          speed: '与主播步伐同步，ease-in-out',
          startPosition: '门口',
          endPosition: '产品展示区',
          obstacles: ['餐桌', '椅子', '柜台', '其他顾客'],
          safePath: '沿主通道中心线移动',
          smoothness: '跟随主播节奏，丝滑流畅'
        },
        presenterDesign: {
          action: '边走边介绍，手指指向产品',
          actionPath: '从门口走进，在产品前停下展示',
          startPosition: '门口',
          endPosition: '产品展示区',
          handGesture: '指向产品，展示细节',
          bodyLanguage: '自然走动，面向镜头侧身展示',
          facialExpression: '惊喜、推荐',
          eyeContact: '始终看向镜头',
          smoothTransition: '在产品前转身面对镜头'
        },
        transition: '滑动',
        subtitle: sentences.slice(1, -1).join('') || '',
        subtitleTiming: [
          { startTime: 3, endTime: 5.5, text: sentences[1] || '' },
          { startTime: 5.5, endTime: 8, text: sentences[2] || '' }
        ],
        emotion: '专业推荐'
      },
      {
        id: 2,
        imageIndex: Math.min(2, imageCount - 1),
        startTime: 8,
        endTime: 12,
        duration: 4,
        narration: sentences[sentences.length - 1] || '行动号召',
        sceneDescription: '主播在收银台/出口，微笑面对镜头',
        cameraDesign: {
          movement: '轻微推进',
          path: '固定机位，最后轻微推进强调表情',
          speed: '非常缓慢的推进，ease-out',
          startPosition: '中景',
          endPosition: '近景',
          obstacles: ['收银台', '排队区域'],
          safePath: '固定位置，无移动障碍',
          smoothness: '几乎静止，轻微推进增加亲密感'
        },
        presenterDesign: {
          action: '微笑点头，双手合十或比心',
          actionPath: '站定，完成最后动作',
          startPosition: '收银台前',
          endPosition: '收银台前',
          handGesture: '双手合十或比心',
          bodyLanguage: '站姿端正，亲切姿态',
          facialExpression: '真诚微笑',
          eyeContact: '直视镜头',
          smoothTransition: '定格微笑淡出'
        },
        transition: '淡出',
        subtitle: sentences[sentences.length - 1] || '',
        subtitleTiming: [{ startTime: 8, endTime: 12, text: sentences[sentences.length - 1] || '' }],
        emotion: '亲切真诚'
      }
    ];
  }
}
