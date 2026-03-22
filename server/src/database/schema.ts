/**
 * 用户类型
 */
export interface User {
  id: string
  openid: string
  nickname?: string | null
  avatarUrl?: string | null
  isVip: boolean
  vipPlanId?: string | null
  vipExpireAt?: Date | null
  dailyQuota: number
  usedQuotaToday: number
  lastQuotaResetDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface NewUser {
  id: string
  openid: string
  nickname?: string | null
  avatarUrl?: string | null
  isVip?: boolean
  vipPlanId?: string | null
  vipExpireAt?: Date | null
  dailyQuota?: number
  usedQuotaToday?: number
  lastQuotaResetDate?: Date | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 会员套餐类型
 */
export interface VipPlan {
  id: string
  name: string
  price: number
  quota: number
  description: string
  duration: number
  isActive: boolean
  createdAt: Date
}

export interface NewVipPlan {
  id: string
  name: string
  price: number
  quota: number
  description: string
  duration?: number
  isActive?: boolean
  createdAt: Date
}

/**
 * 会员订单类型
 */
export interface VipOrder {
  id: string
  userId: string
  openid: string
  planId: string
  planName: string
  amount: number
  status: string
  paymentMethod: string
  paidAt?: Date | null
  createdAt: Date
}

export interface NewVipOrder {
  id: string
  userId: string
  openid: string
  planId: string
  planName: string
  amount: number
  status: string
  paymentMethod: string
  paidAt?: Date | null
  createdAt: Date
}

/**
 * 视频历史记录类型
 */
export interface VideoHistory {
  id: string
  userId?: string | null
  openid?: string | null
  images?: string[] | null
  videoUrl: string
  copywriting?: string | null
  thumbnail?: string | null
  storeName?: string | null
  imageUrls?: string[] | null
  createdAt: Date
}

export interface NewVideoHistory {
  id?: string
  userId?: string | null
  openid?: string | null
  images?: string[] | null
  videoUrl?: string
  copywriting?: string | null
  thumbnail?: string | null
  storeName?: string | null
  imageUrls?: string[] | null
  createdAt?: Date
}

/**
 * 视频收藏类型
 */
export interface VideoFavorites {
  id: string
  userId?: string | null
  openid?: string | null
  videoUrl: string
  thumbnail?: string | null
  title?: string | null
  author?: string | null
  avatar?: string | null
  storeName?: string | null
  coverImage?: string | null
  views?: number
  likes?: number
  category?: string | null
  createdAt: Date
}

export interface NewVideoFavorites {
  id?: string
  userId?: string | null
  openid?: string | null
  videoUrl?: string
  thumbnail?: string | null
  title?: string | null
  author?: string | null
  avatar?: string | null
  storeName?: string | null
  coverImage?: string | null
  views?: number
  likes?: number
  category?: string | null
  createdAt?: Date
}

// 导出虚拟表定义（兼容现有代码）
export const users = {}
export const vipPlans = {}
export const vipOrders = {}
export const videoHistory = {}
export const videoFavorites = {}
