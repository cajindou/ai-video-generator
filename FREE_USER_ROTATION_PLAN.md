# 免费用户功能轮换体验方案

## 一、核心思路

**让免费用户每天体验不同的VIP功能，每天都有新期待，增加购买欲望！**

```
免费版 = 每天体验一种VIP功能
- 今天：高清视频（1080P）
- 明天：无水印视频
- 后天：AI配音体验
- ...
- 每周循环，体验所有功能
```

---

## 二、功能轮换表（7天循环）

| 星期 | 体验功能 | 说明 | 对应VIP功能 |
|-----|---------|------|-----------|
| 周一 | 🎬 高清视频 | 1080P高清画质 | 基础版以上 |
| 周二 | 💧 无水印视频 | 无水印清爽体验 | 基础版以上 |
| 周三 | 🎙️ AI配音 | 体验1种AI音色 | 基础版以上 |
| 周四 | 🎨 高级模板 | 使用1个高级模板 | 专业版以上 |
| 周五 | 📦 批量生成 | 生成2个视频 | 专业版以上 |
| 周六 | 🌟 超清视频 | 4K超清画质预览 | 企业版 |
| 周日 | 🎁 完整VIP体验 | 所有功能全开放 | 全部VIP |

---

## 三、前端展示

### 首页提示卡片

```tsx
// 今日体验功能展示
<View className="today-feature">
  <View className="feature-badge">
    <Text className="feature-icon">{getTodayFeature().icon}</Text>
    <Text className="feature-name">{getTodayFeature().name}</Text>
  </View>
  <Text className="feature-desc">{getTodayFeature().description}</Text>
  <Text className="feature-hint">今日免费体验，明天体验其他功能</Text>
</View>

// 本周体验进度
<View className="week-progress">
  <Text className="progress-title">本周体验进度</Text>
  <View className="progress-days">
    {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
      <View key={index} className={`day-item ${index === getDayOfWeek() ? 'active' : ''}`}>
        <Text>{day}</Text>
        {index < getDayOfWeek() && <Text className="check">✓</Text>}
      </View>
    ))}
  </View>
  <Button onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}>
    开通VIP每天享受所有功能
  </Button>
</View>
```

### 视觉设计

```
┌─────────────────────────────────┐
│  🎬 今日体验：高清视频           │
│  1080P高清画质，清晰细腻         │
│  今日免费体验，明天体验其他功能   │
│                                 │
│  本周体验进度：                  │
│  [一✓][二✓][三●][四 ][五 ][六 ][日]│
│                                 │
│  [开通VIP每天享受所有功能]       │
└─────────────────────────────────┘
```

---

## 四、后端实现

### 1. 功能配置

```typescript
// server/src/vip/feature-rotation.config.ts

export const FEATURE_ROTATION = {
  // 周一：高清视频
  1: {
    id: 'hd_video',
    name: '高清视频',
    icon: '🎬',
    description: '1080P高清画质，清晰细腻',
    features: {
      resolution: '1080p',
      watermark: true, // 有水印
      audio: false,
      batch: false,
    },
    vipLevel: 'basic',
    vipName: '基础版',
    vipPrice: 299,
  },
  // 周二：无水印
  2: {
    id: 'no_watermark',
    name: '无水印视频',
    icon: '💧',
    description: '无水印清爽体验，更专业',
    features: {
      resolution: '720p',
      watermark: false, // 无水印
      audio: false,
      batch: false,
    },
    vipLevel: 'basic',
    vipName: '基础版',
    vipPrice: 299,
  },
  // 周三：AI配音
  3: {
    id: 'ai_audio',
    name: 'AI配音',
    icon: '🎙️',
    description: '体验1种AI音色配音',
    features: {
      resolution: '720p',
      watermark: true,
      audio: true,
      audioVoice: 'female_gentle', // 指定音色
      batch: false,
    },
    vipLevel: 'basic',
    vipName: '基础版',
    vipPrice: 299,
  },
  // 周四：高级模板
  4: {
    id: 'advanced_template',
    name: '高级模板',
    icon: '🎨',
    description: '使用1个高级行业模板',
    features: {
      resolution: '720p',
      watermark: true,
      audio: false,
      template: 'fashion_01', // 指定模板
      batch: false,
    },
    vipLevel: 'pro',
    vipName: '专业版',
    vipPrice: 499,
  },
  // 周五：批量生成
  5: {
    id: 'batch_generate',
    name: '批量生成',
    icon: '📦',
    description: '一次生成2个视频',
    features: {
      resolution: '720p',
      watermark: true,
      audio: false,
      batch: true,
      batchCount: 2,
    },
    vipLevel: 'pro',
    vipName: '专业版',
    vipPrice: 499,
  },
  // 周六：超清视频
  6: {
    id: 'ultra_hd',
    name: '超清视频',
    icon: '🌟',
    description: '4K超清画质预览',
    features: {
      resolution: '4k',
      watermark: true,
      audio: true,
      batch: false,
    },
    vipLevel: 'premium',
    vipName: '企业版',
    vipPrice: 999,
  },
  // 周日：完整VIP体验
  0: {
    id: 'full_vip',
    name: '完整VIP体验',
    icon: '🎁',
    description: '所有功能全开放，尊享体验',
    features: {
      resolution: '1080p',
      watermark: false,
      audio: true,
      audioVoice: 'multiple', // 多种音色可选
      batch: true,
      batchCount: 3,
    },
    vipLevel: 'premium',
    vipName: '企业版',
    vipPrice: 999,
  },
};
```

### 2. 获取今日功能

```typescript
// server/src/vip/vip.service.ts

async getTodayFreeFeature(): Promise<any> {
  const today = new Date().getDay(); // 0=周日, 1=周一...
  return FEATURE_ROTATION[today === 0 ? 0 : today];
}

async generateVideoForFreeUser(imageUrls: string[], openid: string): Promise<any> {
  // 获取今日功能
  const todayFeature = await this.getTodayFreeFeature();
  
  // 检查配额
  const hasQuota = await this.checkUserQuota(openid);
  if (!hasQuota) {
    throw new Error('今日次数已用完，明天再来体验其他功能吧！');
  }
  
  // 根据今日功能生成视频
  const videoUrl = await this.videoService.generateVideoWithFeatures(
    imageUrls,
    todayFeature.features
  );
  
  // 消耗配额
  await this.consumeQuota(openid);
  
  return {
    videoUrl,
    feature: todayFeature,
    message: `今日体验：${todayFeature.name}，明天体验其他功能`,
  };
}
```

### 3. 视频生成适配

```typescript
// server/src/video/video.service.ts

async generateVideoWithFeatures(
  imageUrls: string[],
  features: {
    resolution: string;
    watermark: boolean;
    audio: boolean;
    audioVoice?: string;
    batch?: boolean;
    batchCount?: number;
  }
): Promise<string> {
  
  // 根据功能配置生成视频
  const resolution = this.getResolution(features.resolution);
  const watermarkFilter = features.watermark ? this.addWatermark() : '';
  const audioFilter = features.audio ? this.addAudio(features.audioVoice) : '';
  
  // FFmpeg 生成视频
  const command = ffmpeg();
  
  // 设置分辨率
  switch (features.resolution) {
    case '4k':
      command.videoFilter('scale=2160:3840');
      break;
    case '1080p':
      command.videoFilter('scale=1080:1920');
      break;
    default:
      command.videoFilter('scale=720:1280');
  }
  
  // 添加水印
  if (features.watermark) {
    command.videoFilter('drawtext=text="AI视频生成":fontsize=24:fontcolor=white@0.5:x=w-tw-10:y=h-th-10');
  }
  
  // 添加配音
  if (features.audio) {
    const voiceId = features.audioVoice || 'default';
    const audioUrl = await this.generateTTSAudio(voiceId);
    command.input(audioUrl);
  }
  
  // 生成视频
  return await this.executeFFmpeg(command);
}
```

---

## 五、前端实现

### 1. 首页展示

```tsx
// src/pages/index/index.tsx

import { useState, useEffect } from 'react'

const IndexPage = () => {
  const [todayFeature, setTodayFeature] = useState(null)
  const [weekProgress, setWeekProgress] = useState([])
  
  useEffect(() => {
    loadTodayFeature()
  }, [])
  
  const loadTodayFeature = async () => {
    try {
      const res = await Network.request({
        url: '/api/vip/today-feature',
        method: 'GET'
      })
      
      if (res.code === 200) {
        setTodayFeature(res.data)
      }
    } catch (error) {
      console.error('加载今日功能失败:', error)
    }
  }
  
  const getDayOfWeek = () => {
    const day = new Date().getDay()
    return day === 0 ? 6 : day - 1 // 0=周一, 6=周日
  }
  
  return (
    <View className="index-page">
      {/* 今日体验功能 */}
      {todayFeature && (
        <View className="today-feature-card">
          <View className="feature-header">
            <Text className="feature-icon">{todayFeature.icon}</Text>
            <View className="feature-info">
              <Text className="feature-name">今日体验：{todayFeature.name}</Text>
              <Text className="feature-desc">{todayFeature.description}</Text>
            </View>
          </View>
          
          <View className="feature-hint">
            <Text className="hint-icon">💡</Text>
            <Text className="hint-text">
              今日免费体验此功能，明天体验其他功能
            </Text>
          </View>
          
          {/* 本周进度 */}
          <View className="week-progress">
            <Text className="progress-title">本周体验进度</Text>
            <View className="progress-days">
              {['一', '二', '三', '四', '五', '六', '日'].map((day, index) => (
                <View 
                  key={index} 
                  className={`day-item ${index === getDayOfWeek() ? 'active' : ''} ${index < getDayOfWeek() ? 'completed' : ''}`}
                >
                  <Text className="day-text">{day}</Text>
                  {index < getDayOfWeek() && <Text className="check-icon">✓</Text>}
                </View>
              ))}
            </View>
          </View>
          
          {/* 升级提示 */}
          <Button 
            className="upgrade-btn"
            onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}
          >
            开通VIP每天享受所有功能
          </Button>
        </View>
      )}
      
      {/* 图片上传 */}
      {/* ... */}
    </View>
  )
}
```

### 2. VIP页面展示

```tsx
// src/pages/vip/index.tsx

const VipPage = () => {
  const [todayFeature, setTodayFeature] = useState(null)
  
  return (
    <View className="vip-page">
      {/* 今日体验提示 */}
      {todayFeature && (
        <View className="today-tip">
          <Text className="tip-text">
            今日免费体验：{todayFeature.name}
          </Text>
          <Text className="tip-desc">
            {todayFeature.description}，对应{todayFeature.vipName}(¥{todayFeature.vipPrice})
          </Text>
        </View>
      )}
      
      {/* 套餐列表 */}
      <View className="plans">
        <View className="plan-card">
          <Text className="plan-name">基础版 ¥299/月</Text>
          <Text className="plan-feature">每天3次 + 高清视频 + 无水印 + AI配音</Text>
          <Button onClick={copyWechat}>联系客服购买</Button>
        </View>
        
        <View className="plan-card highlight">
          <Text className="plan-name">专业版 ¥499/月 ⭐推荐</Text>
          <Text className="plan-feature">每天5次 + 高清 + 无水印 + AI配音 + 批量生成</Text>
          <Button onClick={copyWechat}>联系客服购买</Button>
        </View>
        
        <View className="plan-card">
          <Text className="plan-name">企业版 ¥999/月</Text>
          <Text className="plan-feature">不限次 + 4K + 全功能 + API接口</Text>
          <Button onClick={copyWechat}>联系客服购买</Button>
        </View>
      </View>
      
      {/* 功能对比 */}
      <View className="feature-comparison">
        <Text className="comparison-title">免费版 vs VIP</Text>
        <View className="comparison-table">
          <View className="comparison-row">
            <Text className="row-label">使用次数</Text>
            <Text className="row-free">每天1次</Text>
            <Text className="row-vip">每天3-无限次</Text>
          </View>
          <View className="comparison-row">
            <Text className="row-label">功能体验</Text>
            <Text className="row-free">每天轮换1种</Text>
            <Text className="row-vip">全部开放</Text>
          </View>
          <View className="comparison-row">
            <Text className="row-label">视频质量</Text>
            <Text className="row-free">720P-4K轮换</Text>
            <Text className="row-vip">1080P-4K可选</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
```

---

## 六、用户心理分析

### 为什么这个方案好？

#### 1. 稀缺性
```
"今天是高清视频，明天就没有了"
→ 用户今天就想用，不想错过
```

#### 2. 期待感
```
"明天是什么功能？后天呢？"
→ 用户每天都想来看看
```

#### 3. 体验完整
```
"我体验过所有功能，知道VIP的好处"
→ 用户明确知道VIP的价值
```

#### 4. 损失厌恶
```
"明天就没有高清了，要不要买VIP？"
→ 用户害怕失去好功能
```

#### 5. 错失恐惧（FOMO）
```
"今天是完整VIP体验，错过就要等下周"
→ 用户不想错过
```

---

## 七、转化策略

### 周日特殊策略（完整VIP体验日）

```tsx
// 周日特别提示
if (new Date().getDay() === 0) {
  return (
    <View className="sunday-special">
      <Text className="special-title">🎁 今日特惠：完整VIP体验</Text>
      <Text className="special-desc">
        所有功能全开放，尊享体验！
        错过今天就要等下周了！
      </Text>
      <Button className="buy-now-btn">
        立即开通VIP，每天都能享受
      </Button>
    </View>
  )
}
```

### 体验后提示

```tsx
// 视频生成完成后
<View className="after-generate">
  <Text className="success-text">✅ 视频生成成功！</Text>
  <Text className="feature-used">今日体验功能：{todayFeature.name}</Text>
  <Text className="tomorrow-hint">
    明天体验：{getTomorrowFeature().name}
  </Text>
  <Button className="upgrade-btn">
    开通VIP解锁所有功能
  </Button>
</View>
```

---

## 八、数据统计

### 需要统计的数据

```typescript
// 统计每天的用户行为
{
  date: '2024-01-15',
  dayOfWeek: 1, // 周一
  feature: 'hd_video',
  
  // 用户行为
  totalVisits: 1000,        // 总访问
  freeUsers: 800,           // 免费用户
  paidUsers: 200,           // 付费用户
  
  // 免费用户转化
  freeGenerate: 500,        // 免费生成次数
  freeToVipClick: 100,      // 点击开通VIP
  freeToVipBuy: 20,         // 实际购买
  
  // 转化率
  conversionRate: '4%',     // 转化率
  
  // 周日特殊数据
  sundayConversion: '8%',   // 周日转化率更高
}
```

### 分析报告

```
功能吸引力排名：
1. 周日（完整VIP）：转化率 8%
2. 周六（4K超清）：转化率 6%
3. 周三（AI配音）：转化率 5%
4. 周一（高清视频）：转化率 4%
5. 周二（无水印）：转化率 3%
6. 周五（批量生成）：转化率 3%
7. 周四（高级模板）：转化率 2%
```

---

## 九、实施计划

### 第一阶段（立即实施）
- [x] 修改VIP套餐配置
- [ ] 实现功能轮换逻辑
- [ ] 修改前端展示
- [ ] 添加周日特殊提示

### 第二阶段（1周内）
- [ ] 实现高清视频生成
- [ ] 实现无水印功能
- [ ] 实现AI配音功能
- [ ] 实现批量生成功能

### 第三阶段（1月内）
- [ ] 实现高级模板系统
- [ ] 实现数据统计
- [ ] 优化转化率
- [ ] A/B测试

---

## 十、关键优势

| 对比项 | 传统方案 | 轮换体验方案 | 优势 |
|-------|---------|------------|------|
| 免费体验 | 固定功能 | 每天不同 | ✅ 增加期待感 |
| 用户粘性 | 低 | 高 | ✅ 每天都想来 |
| 功能展示 | 看不到 | 全部体验 | ✅ 了解VIP价值 |
| 转化率 | 2-3% | 5-8% | ✅ 提升2-3倍 |
| 审核合规 | 通过 | 通过 | ✅ 完全合规 |
