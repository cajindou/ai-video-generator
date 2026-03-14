"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoFavorites = exports.videoHistory = exports.vipOrders = exports.vipPlans = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    openid: (0, sqlite_core_1.text)('openid').notNull().unique(),
    nickname: (0, sqlite_core_1.text)('nickname').$type(),
    avatarUrl: (0, sqlite_core_1.text)('avatar_url').$type(),
    isVip: (0, sqlite_core_1.integer)('is_vip', { mode: 'boolean' }).default(false),
    vipPlanId: (0, sqlite_core_1.text)('vip_plan_id').$type(),
    vipExpireAt: (0, sqlite_core_1.integer)('vip_expire_at', { mode: 'timestamp' }).$type(),
    dailyQuota: (0, sqlite_core_1.integer)('daily_quota').default(3),
    usedQuotaToday: (0, sqlite_core_1.integer)('used_quota_today').default(0),
    lastQuotaResetDate: (0, sqlite_core_1.integer)('last_quota_reset_date', { mode: 'timestamp' }).$type(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
    updatedAt: (0, sqlite_core_1.integer)('updated_at', { mode: 'timestamp' }).notNull(),
});
exports.vipPlans = (0, sqlite_core_1.sqliteTable)('vip_plans', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    price: (0, sqlite_core_1.integer)('price').notNull(),
    quota: (0, sqlite_core_1.integer)('quota').notNull(),
    description: (0, sqlite_core_1.text)('description').notNull(),
    duration: (0, sqlite_core_1.integer)('duration').default(30),
    isActive: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
});
exports.vipOrders = (0, sqlite_core_1.sqliteTable)('vip_orders', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').notNull(),
    openid: (0, sqlite_core_1.text)('openid').notNull(),
    planId: (0, sqlite_core_1.text)('plan_id').notNull(),
    planName: (0, sqlite_core_1.text)('plan_name').notNull(),
    amount: (0, sqlite_core_1.integer)('amount').notNull(),
    status: (0, sqlite_core_1.text)('status').notNull(),
    paymentMethod: (0, sqlite_core_1.text)('payment_method').notNull(),
    paidAt: (0, sqlite_core_1.integer)('paid_at', { mode: 'timestamp' }).$type(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
});
exports.videoHistory = (0, sqlite_core_1.sqliteTable)('video_history', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').$type(),
    openid: (0, sqlite_core_1.text)('openid').$type(),
    images: (0, sqlite_core_1.text)('images', { mode: 'json' }).$type(),
    videoUrl: (0, sqlite_core_1.text)('video_url').notNull(),
    copywriting: (0, sqlite_core_1.text)('copywriting').$type(),
    thumbnail: (0, sqlite_core_1.text)('thumbnail').$type(),
    storeName: (0, sqlite_core_1.text)('store_name').$type(),
    imageUrls: (0, sqlite_core_1.text)('image_urls', { mode: 'json' }).$type(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
});
exports.videoFavorites = (0, sqlite_core_1.sqliteTable)('video_favorites', {
    id: (0, sqlite_core_1.text)('id').primaryKey(),
    userId: (0, sqlite_core_1.text)('user_id').$type(),
    openid: (0, sqlite_core_1.text)('openid').$type(),
    videoUrl: (0, sqlite_core_1.text)('video_url').notNull(),
    thumbnail: (0, sqlite_core_1.text)('thumbnail').$type(),
    title: (0, sqlite_core_1.text)('title').$type(),
    author: (0, sqlite_core_1.text)('author').$type(),
    avatar: (0, sqlite_core_1.text)('avatar').$type(),
    storeName: (0, sqlite_core_1.text)('store_name').$type(),
    coverImage: (0, sqlite_core_1.text)('cover_image').$type(),
    views: (0, sqlite_core_1.integer)('views').default(0),
    likes: (0, sqlite_core_1.integer)('likes').default(0),
    category: (0, sqlite_core_1.text)('category').$type(),
    createdAt: (0, sqlite_core_1.integer)('created_at', { mode: 'timestamp' }).notNull(),
});
//# sourceMappingURL=schema.js.map