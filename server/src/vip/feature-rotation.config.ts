/**
 * 免费用户功能轮换配置
 * 每天体验不同的VIP功能，7天循环
 */

export interface DailyFeature {
  id: string;
  name: string;
  icon: string;
  description: string;
  features: {
    resolution: '720p' | '1080p' | '4k';
    watermark: boolean;
    audio: boolean;
    audioVoice?: string;
    batch: boolean;
    batchCount?: number;
    template?: string;
  };
  vipLevel: 'basic' | 'pro' | 'premium';
  vipName: string;
  vipPrice: number;
}

/**
 * 功能轮换表（7天循环）
 * 
 * 周一：高清视频（1080P）
 * 周二：无水印视频
 * 周三：AI配音体验
 * 周四：高级模板
 * 周五：批量生成
 * 周六：4K超清视频预览
 * 周日：完整VIP体验（所有功能）
 */
export const FEATURE_ROTATION: Record<number, DailyFeature> = {
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
  
  // 周二：无水印视频
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
    description: '体验AI智能配音，声音动听',
    features: {
      resolution: '720p',
      watermark: true,
      audio: true,
      audioVoice: 'female_gentle', // 指定音色：温柔女声
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
    description: '使用专业行业模板，更精美',
    features: {
      resolution: '720p',
      watermark: true,
      audio: false,
      template: 'fashion_01', // 指定模板：时尚风格
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
    description: '一次生成2个视频，效率翻倍',
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
    description: '4K超清画质预览，极致体验',
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

/**
 * 获取今日功能
 * @returns 今日体验的功能配置
 */
export function getTodayFeature(): DailyFeature {
  const today = new Date().getDay(); // 0=周日, 1=周一, ..., 6=周六
  return FEATURE_ROTATION[today];
}

/**
 * 获取明天的功能
 * @returns 明天体验的功能配置
 */
export function getTomorrowFeature(): DailyFeature {
  const today = new Date().getDay();
  const tomorrow = today === 6 ? 0 : today + 1;
  return FEATURE_ROTATION[tomorrow];
}

/**
 * 获取本周所有功能
 * @returns 本周功能列表（按周一到周日排序）
 */
export function getWeekFeatures(): DailyFeature[] {
  return [1, 2, 3, 4, 5, 6, 0].map(day => FEATURE_ROTATION[day]);
}

/**
 * 获取今天是周几（0-6）
 * 0 = 周一, 6 = 周日
 */
export function getDayIndex(): number {
  const day = new Date().getDay();
  return day === 0 ? 6 : day - 1; // 转换为 0=周一, 6=周日
}
