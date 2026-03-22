# AI口播探店视频生成 - 完整实施方案

## 一、需求重新定义

### 核心目标
生成专业的探店口播视频，AI识别图片中的具体产品/场景，针对每个产品生成营销口播文案。

### 文案结构（痛点-亮点-差异化）
```
1. 痛点引入："还在为XX烦恼吗？"
2. 产品展示："看看这个..."
3. 优势卖点："它的特点是..."
4. 差异化："和其他产品不一样的是..."
5. 行动号召："赶紧来试试吧！"
```

### 行业适配（360行）
- 餐饮：菜品、环境、服务
- 服装：款式、面料、搭配
- 美容：项目、效果、体验
- 数码：功能、性能、性价比
- 家居：设计、材质、实用性
- ...更多行业模板

---

## 二、完整实施计划

### 阶段1：后端核心优化（AI识别 + 文案生成）

#### 1.1 AI图片分析增强
**目标**：识别图片中的所有产品/物品，提取可营销的卖点

**实现**：
```typescript
// server/src/video/video.service.ts

interface ProductAnalysis {
  name: string;           // 产品名称
  category: string;       // 产品类别
  features: string[];     // 产品特点
  painPoints: string[];   // 痛点
  highlights: string[];   // 亮点
  differentiators: string[]; // 差异化卖点
  position: {             // 在图片中的位置
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

async analyzeProductsInImage(imageUrl: string): Promise<ProductAnalysis[]> {
  const prompt = `你是专业的探店达人，请仔细分析这张图片中的所有产品/物品。

要求：
1. 识别图片中的所有产品/物品（至少1-3个）
2. 对每个产品分析：
   - 产品名称
   - 产品类别（如：菜品、服装、家具、服务等）
   - 产品特点（外观、材质、功能等）
   - 痛点（用户为什么需要它）
   - 亮点（最吸引人的特点）
   - 差异化（与竞品相比的优势）
3. 如果图片中没有明显产品，则分析场景、氛围、服务等

输出格式（JSON）：
{
  "products": [
    {
      "name": "产品名称",
      "category": "类别",
      "features": ["特点1", "特点2"],
      "painPoints": ["痛点1", "痛点2"],
      "highlights": ["亮点1", "亮点2"],
      "differentiators": ["差异化1", "差异化2"]
    }
  ]
}`;

  const result = await this.llmService.analyzeImage(imageUrl, prompt);
  return JSON.parse(result).products;
}
```

#### 1.2 文案生成优化（痛点-亮点-差异化结构）
**目标**：针对每个产品生成营销型口播文案

**实现**：
```typescript
interface CopywritingSegment {
  product: string;        // 产品名称
  duration: number;       // 时长（秒）
  text: string;           // 口播文案
  position: number;       // 在视频中的位置（秒）
}

async generateMarketingCopywriting(
  products: ProductAnalysis[],
  industry: string
): Promise<CopywritingSegment[]> {
  const segments: CopywritingSegment[] = [];
  
  for (const product of products) {
    const prompt = `你是专业的探店口播达人，请为以下产品生成15秒口播文案。

产品信息：
- 名称：${product.name}
- 类别：${product.category}
- 特点：${product.features.join('、')}
- 痛点：${product.painPoints.join('、')}
- 亮点：${product.highlights.join('、')}
- 差异化：${product.differentiators.join('、')}

行业：${industry}

文案要求：
1. 采用"痛点引入 → 产品展示 → 亮点卖点 → 差异化 → 行动号召"结构
2. 语言口语化，适合口播
3. 有感染力，能激发购买欲望
4. 字数控制在80-120字
5. 每次生成不同的创意角度

输出格式（JSON）：
{
  "text": "口播文案内容"
}`;

    const result = await this.llmService.generateText(prompt, { temperature: 0.9 });
    const copywriting = JSON.parse(result);
    
    segments.push({
      product: product.name,
      duration: 15,
      text: copywriting.text,
      position: segments.length * 15
    });
  }
  
  return segments;
}
```

#### 1.3 视频生成优化（带字幕 + 背景音乐）
**目标**：生成带字幕的专业探店视频

**实现**：
```typescript
async generateVideoWithSubtitles(
  imageUrl: string,
  copywriting: CopywritingSegment[],
  options: { withMusic: boolean }
): Promise<string> {
  const totalDuration = copywriting.reduce((sum, seg) => sum + seg.duration, 0);
  
  // 构建字幕滤镜
  const subtitleFilters = copywriting.map((seg, index) => {
    const escapedText = seg.text.replace(/'/g, "\\'").replace(/:/g, "\\:");
    return `drawtext=text='${escapedText}':fontsize=48:fontcolor=white:borderw=2:bordercolor=black:x=(w-text_w)/2:y=h-200:enable='between(t,${seg.position},${seg.position + seg.duration})'`;
  });
  
  // FFmpeg 命令
  const command = ffmpeg()
    .input(imageUrl)
    .loop(totalDuration)
    .videoFilter([
      'scale=1080:1920',
      ...subtitleFilters
    ])
    .audioFilter('anullsrc=r=44100:cl=stereo')
    .outputOptions([
      '-c:v libx264',
      '-preset medium',
      '-crf 23',
      '-c:a aac',
      '-t', totalDuration.toString()
    ]);
  
  if (options.withMusic) {
    command.input(backgroundMusicPath);
  }
  
  return new Promise((resolve, reject) => {
    command.save(outputPath)
      .on('end', () => resolve(outputPath))
      .on('error', reject);
  });
}
```

---

### 阶段2：前端交互优化

#### 2.1 进度显示页面
**目标**：实时显示视频生成进度，让用户知道AI在做什么

**实现**：
```tsx
// src/pages/progress/index.tsx

const ProgressPage = () => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [analysis, setAnalysis] = useState<ProductAnalysis[]>([]);
  
  useEffect(() => {
    const pollProgress = async () => {
      const result = await Network.request({
        url: `/api/video/task/${taskId}`
      });
      
      setProgress(result.data.progress);
      setStep(result.data.step);
      
      if (result.data.analysis) {
        setAnalysis(result.data.analysis);
      }
      
      if (result.data.status === 'completed') {
        Taro.navigateTo({ url: `/pages/video-player/index?videoUrl=${result.data.videoUrl}` });
      }
    };
    
    const timer = setInterval(pollProgress, 1000);
    return () => clearInterval(timer);
  }, [taskId]);
  
  return (
    <View className="flex flex-col h-full bg-white">
      {/* 进度条 */}
      <View className="p-6">
        <Text className="block text-lg font-semibold mb-4">正在生成视频...</Text>
        <Progress percent={progress} strokeColor="#07C160" />
        <Text className="block text-sm text-gray-500 mt-2">{step}</Text>
      </View>
      
      {/* AI分析结果 */}
      {analysis.length > 0 && (
        <View className="p-6">
          <Text className="block text-lg font-semibold mb-4">AI识别到的产品</Text>
          {analysis.map((product, index) => (
            <View key={index} className="bg-gray-50 rounded-lg p-4 mb-3">
              <Text className="block font-semibold">{product.name}</Text>
              <Text className="block text-sm text-gray-500 mt-1">
                亮点：{product.highlights.join('、')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};
```

#### 2.2 视频播放页面
**目标**：展示生成的视频和口播文案

**实现**：
```tsx
// src/pages/video-player/index.tsx

const VideoPlayerPage = () => {
  const [videoUrl, setVideoUrl] = useState('');
  const [copywriting, setCopywriting] = useState<CopywritingSegment[]>([]);
  
  return (
    <View className="flex flex-col h-full bg-white">
      {/* 视频播放器 */}
      <Video
        src={videoUrl}
        className="w-full h-96"
        controls
        autoplay
      />
      
      {/* 口播文案 */}
      <View className="p-6">
        <Text className="block text-lg font-semibold mb-4">口播文案</Text>
        {copywriting.map((seg, index) => (
          <View key={index} className="mb-4">
            <Text className="block text-sm text-gray-500">{seg.product}</Text>
            <Text className="block text-base mt-1">{seg.text}</Text>
          </View>
        ))}
      </View>
      
      {/* 操作按钮 */}
      <View className="flex flex-row gap-4 p-6">
        <Button className="flex-1" type="primary">下载视频</Button>
        <Button className="flex-1">分享</Button>
      </View>
    </View>
  );
};
```

---

### 阶段3：行业模板系统

#### 3.1 行业识别
**目标**：自动识别店铺类型，使用对应模板

**实现**：
```typescript
// server/src/video/industry-templates.ts

const INDUSTRY_TEMPLATES = {
  restaurant: {
    name: '餐饮',
    keywords: ['菜品', '美食', '餐厅', '火锅', '烧烤', '奶茶', '咖啡'],
    copywritingStyle: '美食诱惑型',
    painPoints: ['饿了不知道吃什么', '想找好吃又实惠的', '环境要好的'],
    highlights: ['味道', '分量', '性价比', '环境', '服务'],
  },
  fashion: {
    name: '服装',
    keywords: ['衣服', '服装', '时尚', '穿搭', '潮流'],
    copywritingStyle: '时尚潮流型',
    painPoints: ['不知道怎么搭配', '找不到合适的款式', '质量不好'],
    highlights: ['款式', '面料', '搭配', '性价比'],
  },
  beauty: {
    name: '美容',
    keywords: ['美容', '护肤', '美发', '美甲', 'SPA', '按摩'],
    copywritingStyle: '体验分享型',
    painPoints: ['皮肤问题', '想要变美', '放松身心'],
    highlights: ['效果', '技术', '环境', '服务'],
  },
  digital: {
    name: '数码',
    keywords: ['手机', '电脑', '数码', '电子产品', '智能设备'],
    copywritingStyle: '科技评测型',
    painPoints: ['想换新设备', '不知道买哪个', '怕被坑'],
    highlights: ['性能', '功能', '性价比', '体验'],
  },
  // ... 更多行业
};

function detectIndustry(products: ProductAnalysis[]): string {
  for (const [industry, template] of Object.entries(INDUSTRY_TEMPLATES)) {
    for (const product of products) {
      for (const keyword of template.keywords) {
        if (product.name.includes(keyword) || product.category.includes(keyword)) {
          return industry;
        }
      }
    }
  }
  return 'general';
}
```

---

## 三、实施顺序

### Step 1: 后端核心优化（约15分钟）
1. 增强 AI 图片分析（识别产品、痛点、亮点）
2. 优化文案生成（营销结构）
3. 添加字幕生成（FFmpeg drawtext）
4. 添加进度查询接口

### Step 2: 前端页面开发（约15分钟）
1. 创建进度显示页面
2. 创建视频播放页面
3. 优化首页交互

### Step 3: 测试验证（约10分钟）
1. 完整流程测试
2. 多行业测试
3. ESLint + 编译检查

---

## 四、预期效果

### AI识别示例
**输入**：奶茶店图片
**AI识别**：
- 产品1：珍珠奶茶
  - 痛点：想喝奶茶又怕胖
  - 亮点：低糖低卡、珍珠Q弹
  - 差异化：独家配方、新鲜现做

### 口播文案示例
**产品1：珍珠奶茶（15秒）**
"还在为喝奶茶怕胖而纠结吗？看看这杯珍珠奶茶！它的甜度刚刚好，低糖低卡，珍珠Q弹有嚼劲，和外面的妖艳贱货完全不一样！独家配方，每天新鲜现做，赶紧来试试吧！"

### 视频效果
- 图片展示 + 产品标注
- 字幕同步显示口播文案
- 可选背景音乐
- 15-30秒专业探店视频

---

## 五、关键改进点

| 改进项 | 之前 | 之后 |
|--------|------|------|
| AI识别 | 仅识别店名 | 识别所有产品+痛点+亮点+差异化 |
| 文案结构 | 简单描述 | 痛点引入→产品展示→亮点→差异化→行动号召 |
| 视频内容 | 图片轮播 | 图片+产品聚焦+字幕+口播 |
| 用户体验 | 黑屏等待 | 实时进度+AI分析展示 |
| 行业适配 | 无 | 360行模板系统 |

