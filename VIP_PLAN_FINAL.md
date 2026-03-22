# VIP套餐最终方案（符合小程序审核要求）

## 一、套餐配置

### 免费体验版（0元）
- **配额**：每天1次（体验功能，防止滥用）
- **视频质量**：720P（标清）
- **水印**：有水印（推广品牌）
- **配音**：无（仅字幕）
- **批量生成**：不支持
- **历史记录**：保留3天
- **目的**：让用户体验功能，符合审核要求

### 基础版（¥299/月）
- **配额**：每天3次
- **视频质量**：1080P（高清）
- **水印**：无水印
- **配音**：AI配音（5种音色）
- **批量生成**：不支持
- **历史记录**：保留30天
- **适合人群**：个人用户、偶尔使用

### 专业版（¥499/月）⭐ 推荐
- **配额**：每天5次
- **视频质量**：1080P（高清）
- **水印**：无水印
- **配音**：AI配音（10种音色）
- **批量生成**：支持（最多5个）
- **历史记录**：永久保留
- **高级模板**：20+行业模板
- **优先处理**：队列优先
- **适合人群**：专业用户、自媒体

### 企业版（¥999/月）
- **配额**：不限次
- **视频质量**：4K（超清）
- **水印**：无水印
- **配音**：AI配音（20种音色+自定义）
- **批量生成**：支持（最多20个）
- **历史记录**：永久保留
- **高级模板**：50+行业模板+自定义
- **优先处理**：最高优先级
- **专属客服**：一对一服务
- **API接口**：开放API调用
- **适合人群**：企业用户、批量生产

---

## 二、功能对比表

| 功能 | 免费体验版 | 基础版¥299 | 专业版¥499 | 企业版¥999 |
|-----|-----------|-----------|-----------|-----------|
| **每日次数** | 1次 | 3次 | 5次 | 不限 |
| **视频质量** | 720P | 1080P | 1080P | 4K |
| **水印** | 有 | 无 | 无 | 无 |
| **AI配音** | ❌ | ✓ 5种音色 | ✓ 10种音色 | ✓ 20种音色 |
| **批量生成** | ❌ | ❌ | ✓ 最多5个 | ✓ 最多20个 |
| **高级模板** | ❌ | ❌ | ✓ 20+ | ✓ 50+ |
| **历史记录** | 3天 | 30天 | 永久 | 永久 |
| **优先处理** | ❌ | ❌ | ✓ | ✓✓ |
| **专属客服** | ❌ | ❌ | ❌ | ✓ |
| **API接口** | ❌ | ❌ | ❌ | ✓ |

---

## 三、小程序审核合规要点

### ✅ 必须符合的要求

#### 1. 虚拟支付限制
**微信规定**：小程序内不能直接购买虚拟商品

**解决方案**：
```
用户点击"购买套餐" 
  → 跳转到VIP页面
  → 展示套餐信息
  → 复制客服微信
  → 联系客服购买
  → 客服手动开通
```

**代码实现**：
```tsx
// ❌ 错误：直接在小程序内支付
<Button onClick={() => pay()}>立即购买</Button>

// ✅ 正确：引导联系客服
<Button onClick={() => {
  Taro.setClipboardData({
    data: '客服微信：18009006222'
  })
  Taro.showToast({ title: '客服微信已复制' })
}}>
  联系客服购买
</Button>
```

#### 2. 功能可用性
**微信规定**：小程序必须提供可用功能

**解决方案**：
- ✅ 免费版提供1次/天（可体验）
- ✅ 上传图片后可以生成视频
- ✅ 功能完整可用

**避免的情况**：
```
❌ 免费版0次 → 用户无法使用 → 审核拒绝
❌ 上传图片后提示"请购买VIP" → 审核拒绝
❌ 功能完全不开放 → 审核拒绝
```

#### 3. 内容合规
**微信规定**：不能有虚假宣传、诱导分享

**解决方案**：
- ✅ 真实标注功能
- ✅ 不夸大宣传
- ✅ 不诱导分享

**示例**：
```tsx
// ❌ 错误：虚假宣传
<Text>AI生成100%满意</Text>

// ✅ 正确：真实描述
<Text>AI智能生成视频，效果因内容而异</Text>
```

---

## 四、前端文案优化

### 首页提示（免费用户）
```tsx
<View className="quota-tip">
  <Text>今日剩余：1/1次</Text>
  <Text className="upgrade-hint" onClick={() => Taro.navigateTo({ url: '/pages/vip/index' })}>
    升级VIP享更多次数 →
  </Text>
</View>
```

### VIP页面文案
```tsx
<View className="vip-page">
  <Text className="title">会员服务</Text>
  <Text className="subtitle">升级解锁更多功能</Text>
  
  <View className="notice">
    <Text>💡 免费用户每天可生成1个视频</Text>
    <Text>升级VIP后可享受更多次数和高级功能</Text>
  </View>
  
  {/* 套餐列表 */}
  {/* ... */}
  
  <View className="payment-notice">
    <Text>购买方式：添加客服微信购买</Text>
    <Text>客服微信：18009006222</Text>
    <Button onClick={copyWechat}>复制客服微信</Button>
  </View>
</View>
```

---

## 五、后端实现要点

### 1. 配额检查
```typescript
// server/src/vip/vip.service.ts

async checkUserQuota(openid: string): Promise<boolean> {
  const quota = await this.getUserQuota(openid);
  
  // 免费用户：1次/天
  // 基础版：3次/天
  // 专业版：5次/天
  // 企业版：不限次
  
  if (quota.remainingQuota <= 0) {
    return false;
  }
  
  return true;
}

async getUserQuota(openid: string) {
  const user = await this.findOrCreateUser(openid);
  
  // 根据VIP等级返回配额
  let dailyQuota = 1; // 默认免费用户1次
  
  if (user.isVip) {
    const plan = await this.getPlan(user.vipPlanId);
    
    switch (plan.id) {
      case 'plan_basic':
        dailyQuota = 3;
        break;
      case 'plan_pro':
        dailyQuota = 5;
        break;
      case 'plan_premium':
        dailyQuota = 999; // 不限次
        break;
    }
  }
  
  return {
    isVip: user.isVip,
    totalQuota: dailyQuota,
    usedQuotaToday: user.usedQuotaToday,
    remainingQuota: Math.max(0, dailyQuota - user.usedQuotaToday),
  };
}
```

### 2. 视频质量限制
```typescript
// server/src/video/video.service.ts

async generateVideo(imageUrls: string[], user: any) {
  // 根据VIP等级决定视频质量
  const quality = user.isVip ? '1080p' : '720p';
  const resolution = user.vipPlanId === 'plan_premium' ? '4k' : quality;
  
  // 根据VIP等级决定是否添加水印
  const addWatermark = !user.isVip;
  
  // 根据VIP等级决定是否添加配音
  const addAudio = user.isVip && user.vipPlanId !== 'plan_basic';
  
  // 生成视频
  return await this.generateVideoWithFFmpeg(imageUrls, {
    resolution,
    addWatermark,
    addAudio,
  });
}
```

---

## 六、数据库配置

```typescript
// server/src/database/schema.ts

export const vipPlans = sqliteTable('vip_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  price: integer('price').notNull(),
  quota: integer('quota').notNull(), // -1 表示不限次
  duration: integer('duration').notNull(), // 天数
  features: text('features'), // JSON格式存储功能列表
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at'),
});

// 初始数据
const defaultPlans = [
  {
    id: 'plan_free',
    name: '免费体验版',
    price: 0,
    quota: 1,
    duration: 0,
    features: JSON.stringify({
      quality: '720p',
      watermark: true,
      audio: false,
      batch: false,
      history: 3,
    }),
  },
  {
    id: 'plan_basic',
    name: '基础版',
    price: 299,
    quota: 3,
    duration: 30,
    features: JSON.stringify({
      quality: '1080p',
      watermark: false,
      audio: true,
      audioVoices: 5,
      batch: false,
      history: 30,
    }),
  },
  {
    id: 'plan_pro',
    name: '专业版',
    price: 499,
    quota: 5,
    duration: 30,
    features: JSON.stringify({
      quality: '1080p',
      watermark: false,
      audio: true,
      audioVoices: 10,
      batch: true,
      batchMax: 5,
      history: -1,
      templates: 20,
      priority: true,
    }),
  },
  {
    id: 'plan_premium',
    name: '企业版',
    price: 999,
    quota: -1,
    duration: 30,
    features: JSON.stringify({
      quality: '4k',
      watermark: false,
      audio: true,
      audioVoices: 20,
      batch: true,
      batchMax: 20,
      history: -1,
      templates: 50,
      priority: 2,
      api: true,
    }),
  },
];
```

---

## 七、合规检查清单

### ✅ 审核前检查

- [ ] 免费版可正常使用（至少1次/天）
- [ ] 无直接支付按钮
- [ ] 无诱导分享文案
- [ ] 无虚假宣传
- [ ] 隐私政策完整
- [ ] 用户协议完整
- [ ] 客服联系方式真实
- [ ] 功能说明真实
- [ ] 价格标注真实
- [ ] 无敏感词汇

### ✅ 测试用例

```typescript
// 测试免费用户流程
test('免费用户可以生成1个视频', async () => {
  const user = await login('free_user');
  
  // 第1次生成应该成功
  const result1 = await generateVideo(user);
  expect(result1.success).toBe(true);
  
  // 第2次生成应该失败
  const result2 = await generateVideo(user);
  expect(result2.success).toBe(false);
  expect(result2.message).toContain('今日次数已用完');
});

// 测试VIP用户流程
test('基础版用户可以生成3个视频', async () => {
  const user = await login('basic_user');
  
  for (let i = 0; i < 3; i++) {
    const result = await generateVideo(user);
    expect(result.success).toBe(true);
  }
  
  const result4 = await generateVideo(user);
  expect(result4.success).toBe(false);
});
```

---

## 八、预期效果

### 用户体验
- ✅ 免费用户可体验功能（符合审核）
- ✅ VIP用户享受更多功能
- ✅ 无违规风险

### 转化率预估
| 用户类型 | 免费用户 | 基础版 | 专业版 | 企业版 |
|---------|---------|--------|--------|--------|
| 初次使用 | 90% | 6% | 3% | 1% |
| 使用1周后 | 70% | 15% | 10% | 5% |
| 使用1月后 | 50% | 25% | 15% | 10% |

### 收入预估（1000用户/月）
- 基础版：250人 × ¥299 = ¥74,750
- 专业版：150人 × ¥499 = ¥74,850
- 企业版：100人 × ¥999 = ¥99,900
- **总收入**：¥249,500/月

---

## 九、关键差异点

| 对比项 | 您的方案 | 优化方案 | 原因 |
|-------|---------|---------|------|
| 免费版次数 | 0次 | 1次 | 符合审核要求 |
| 基础版配音 | 有 | 有 | ✅ 一致 |
| 专业版批量 | 有 | 有 | ✅ 一致 |
| 企业版4K | 有 | 有 | ✅ 一致 |
