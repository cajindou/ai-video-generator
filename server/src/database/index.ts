import * as path from 'path'

// 重新导出类型
export type { 
  User, NewUser, VipPlan, NewVipPlan, VipOrder, NewVipOrder,
  VideoHistory, NewVideoHistory, VideoFavorites, NewVideoFavorites 
} from './schema'

// 使用内存存储（SQLite 在 Node.js v24 上不兼容）
export const useMemoryStorage = true

// 内存存储
export const memoryUsers: Map<string, any> = new Map()
export const memoryPlans: Map<string, any> = new Map()
export const memoryOrders: Map<string, any> = new Map()

// SQLite 暂不可用
export const sqlite = null

console.log(`[Database] 初始化数据库...`)

// 初始化默认套餐数据到内存
memoryPlans.set('plan_basic', {
  id: 'plan_basic',
  name: '基础版',
  price: 29900,
  quota: 10,
  description: '每天10次，当天有效，第二天重置，适合轻度用户',
  duration: 30,
  is_active: true,
  created_at: Date.now()
})
memoryPlans.set('plan_advanced', {
  id: 'plan_advanced',
  name: '进阶版',
  price: 39900,
  quota: 20,
  description: '每天20次，当天有效，第二天重置，适合专业用户',
  duration: 30,
  is_active: true,
  created_at: Date.now()
})
memoryPlans.set('plan_premium', {
  id: 'plan_premium',
  name: '尊享版',
  price: 59900,
  quota: -1,
  description: '30天不限次视频生成，适合重度用户',
  duration: 30,
  is_active: true,
  created_at: Date.now()
})

console.log(`[Database] 内存存储模式已启用（VIP数据不会持久化）`)

// 导出表定义
export { users, vipPlans, vipOrders, videoHistory, videoFavorites } from './schema'
