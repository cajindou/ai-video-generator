import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * 用户表
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  openid: text('openid').notNull().unique(),
  nickname: text('nickname').$type<string>(),
  avatarUrl: text('avatar_url').$type<string>(),
  isVip: integer('is_vip', { mode: 'boolean' }).default(false),
  vipPlanId: text('vip_plan_id').$type<string>(),
  vipExpireAt: integer('vip_expire_at', { mode: 'timestamp' }).$type<Date>(),
  dailyQuota: integer('daily_quota').default(3), // 每日免费配额
  usedQuotaToday: integer('used_quota_today').default(0), // 今日已使用次数
  lastQuotaResetDate: integer('last_quota_reset_date', { mode: 'timestamp' }).$type<Date>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

/**
 * 会员套餐表
 */
export const vipPlans = sqliteTable('vip_plans', {
  id: text('id').primaryKey(),
  name: text('name').notNull(), // 套餐名称：基础版、进阶版、尊享版
  price: integer('price').notNull(), // 价格（元）
  quota: integer('quota').notNull(), // 每日配额：10、20、-1（无限）
  description: text('description').notNull(), // 套餐描述
  duration: integer('duration').default(30), // 有效期（天）
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * 会员订单表
 */
export const vipOrders = sqliteTable('vip_orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(), // 用户ID
  openid: text('openid').notNull(), // 用户openid（用于客服查询）
  planId: text('plan_id').notNull(), // 套餐ID
  planName: text('plan_name').notNull(), // 套餐名称
  amount: integer('amount').notNull(), // 支付金额（分）
  status: text('status').notNull(), // 订单状态：pending、paid、cancelled
  paymentMethod: text('payment_method').notNull(), // 支付方式：wechat_qrcode
  paidAt: integer('paid_at', { mode: 'timestamp' }).$type<Date>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * 视频历史记录表
 */
export const videoHistory = sqliteTable('video_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').$type<string>(),
  openid: text('openid').$type<string>(),
  images: text('images', { mode: 'json' }).$type<string[]>(),
  videoUrl: text('video_url').notNull(),
  copywriting: text('copywriting').$type<string>(),
  thumbnail: text('thumbnail').$type<string>(),
  storeName: text('store_name').$type<string>(),
  imageUrls: text('image_urls', { mode: 'json' }).$type<string[]>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

/**
 * 视频收藏表
 */
export const videoFavorites = sqliteTable('video_favorites', {
  id: text('id').primaryKey(),
  userId: text('user_id').$type<string>(),
  openid: text('openid').$type<string>(),
  videoUrl: text('video_url').notNull(),
  thumbnail: text('thumbnail').$type<string>(),
  title: text('title').$type<string>(),
  author: text('author').$type<string>(),
  avatar: text('avatar').$type<string>(),
  storeName: text('store_name').$type<string>(),
  coverImage: text('cover_image').$type<string>(),
  views: integer('views').default(0),
  likes: integer('likes').default(0),
  category: text('category').$type<string>(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type User = typeof users.$inferSelect
export type NewUser = typeof users.$inferInsert
export type VipPlan = typeof vipPlans.$inferSelect
export type NewVipPlan = typeof vipPlans.$inferInsert
export type VipOrder = typeof vipOrders.$inferSelect
export type NewVipOrder = typeof vipOrders.$inferInsert
export type VideoHistory = typeof videoHistory.$inferSelect
export type NewVideoHistory = typeof videoHistory.$inferInsert
export type VideoFavorites = typeof videoFavorites.$inferSelect
export type NewVideoFavorites = typeof videoFavorites.$inferInsert
