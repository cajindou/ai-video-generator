# 视频生成正确方案

## 核心原则

### ✅ 正确做法
1. **不使用首帧图片** - `firstFrameUrl` 参数不需要
2. **只用文本 Prompt 生成视频** - SDK 会根据 Prompt 自动生成
3. **SDK 自动生成音频** - 包括语音、音效、背景音乐

### ❌ 错误做法
1. ~~使用首帧图片~~ - 图片 URL 可能无法被 API 访问
2. ~~传递图片 URL 给视频生成 API~~ - 会导致 "Invalid URL" 错误

---

## 视频生成流程

### 流程图
```
用户上传图片 → AI分析图片生成文案 → 文案转为Prompt → 调用视频生成API → 返回视频URL
     ↓                ↓
   存储图片      分析店铺、产品、卖点
```

### 关键点
1. 图片只用于 **AI 分析**，不用于视频生成
2. 视频生成只用 **文本 Prompt**
3. Prompt 包含：场景描述、主播形象、口播文案、镜头运动

---

## 代码示例

### ✅ 正确的调用方式
```typescript
const contentItems = [
  {
    type: 'text',
    text: `Professional 12-second shop exploration video.

Scene: A beautiful young female presenter (25 years old, Asian, elegant makeup) in a warm restaurant environment.

Action: She faces the camera with a warm smile, speaking naturally with expressive hand gestures.

Narration: "${copywriting}"

Camera: Smooth tracking shots, zoom in on featured products, dynamic transitions.

Quality: 720p HD, 9:16 vertical format, cinematic.`
  }
];

const response = await this.videoGenerationClient.videoGeneration(contentItems, {
  model: 'doubao-seedance-1-5-pro-251215',
  duration: 12,
  ratio: '9:16',
  resolution: '720p',
  generateAudio: true,
  maxWaitTime: 900
});
```

### ❌ 错误的调用方式
```typescript
// 不要这样做！
const contentItems = [
  {
    type: 'image_url',
    image_url: { url: imageUrl },  // ❌ 错误：不要传图片
    role: 'first_frame'
  },
  {
    type: 'text',
    text: prompt
  }
];
```

---

## 完整 Prompt 模板

```typescript
const buildVideoPrompt = (copywriting: string, industry: string) => {
  return `Professional 12-second ${industry} exploration video.

**Scene Description**:
A beautiful young female presenter (25 years old, Asian, elegant makeup) in a warm ${industry} environment. She faces the camera with a warm smile, speaking naturally with expressive hand gestures.

**Narration (口播文案)**:
"${copywriting}"

**Camera Movements**:
- 0-3s: Wide shot establishing the venue
- 3-6s: Medium shot of presenter speaking
- 6-9s: Close-up of featured products
- 9-12s: Presenter concludes with call-to-action

**Visual Style**:
- Bright, warm lighting
- Clean, professional look
- Smooth transitions
- Product highlights with soft focus

**Audio**:
- Clear presenter narration
- Subtle background music
- Natural ambient sounds

**Technical Specs**:
- Duration: 12 seconds
- Format: 9:16 vertical (mobile-optimized)
- Resolution: 720p HD
- Frame rate: 30fps`;
};
```

---

## 环境变量配置

```bash
# 必须配置（SDK 默认会读取）
COZE_WORKLOAD_IDENTITY_API_KEY=你的API密钥
COZE_INTEGRATION_BASE_URL=https://ark.cn-beijing.volces.com
COZE_INTEGRATION_MODEL_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
```

---

## 注意事项

1. **图片只用于分析** - 上传的图片用于 AI 分析店铺和产品
2. **文案是核心** - 好的文案才能生成好的视频
3. **Prompt 要详细** - 包含场景、动作、镜头、音频等细节
4. **等待时间** - 12秒视频大约需要 3-5 分钟生成
5. **错误处理** - 如果失败，可以重试或降级方案

---

## 修改记录

- 2026-03-26: 确认不使用首帧图片，只用文本 Prompt
