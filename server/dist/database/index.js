"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const Database = require('better-sqlite3');
const schema = require("./schema");
const path = require("path");
const fs = require("fs");
const defaultDbPath = path.join(process.cwd(), 'data.db');
const dbPath = process.env.DATABASE_PATH || defaultDbPath;
const dbDir = path.dirname(dbPath);
try {
    if (!fs.existsSync(dbDir)) {
        console.log(`[Database] 创建数据库目录: ${dbDir}`);
        fs.mkdirSync(dbDir, { recursive: true });
    }
}
catch (error) {
    console.error('[Database] 创建数据库目录失败:', error);
}
let sqlite;
try {
    console.log(`[Database] 尝试打开数据库: ${dbPath}`);
    sqlite = new Database(dbPath, { verbose: console.log });
    console.log(`[Database] 数据库连接成功: ${dbPath}`);
}
catch (error) {
    console.error('[Database] 数据库连接失败:', error.message);
    const fallbackPath = path.join('/tmp', 'coze-mini-program.db');
    console.log(`[Database] 尝试使用备用路径: ${fallbackPath}`);
    try {
        const fallbackDir = path.dirname(fallbackPath);
        if (!fs.existsSync(fallbackDir)) {
            fs.mkdirSync(fallbackDir, { recursive: true });
        }
        sqlite = new Database(fallbackPath, { verbose: console.log });
        console.log(`[Database] 备用路径连接成功: ${fallbackPath}`);
    }
    catch (fallbackError) {
        console.error('[Database] 备用路径连接失败:', fallbackError.message);
        throw new Error(`数据库初始化失败: ${fallbackError.message}`);
    }
}
sqlite.pragma('journal_mode = WAL');
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    openid TEXT NOT NULL UNIQUE,
    nickname TEXT,
    avatar_url TEXT,
    is_vip INTEGER DEFAULT 0,
    vip_plan_id TEXT,
    vip_expire_at INTEGER,
    daily_quota INTEGER DEFAULT 3,
    used_quota_today INTEGER DEFAULT 0,
    last_quota_reset_date INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )
`);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS vip_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quota INTEGER NOT NULL,
    description TEXT NOT NULL,
    duration INTEGER DEFAULT 30,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER NOT NULL
  )
`);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS vip_orders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    openid TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    amount INTEGER NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    paid_at INTEGER,
    created_at INTEGER NOT NULL
  )
`);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS video_history (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    openid TEXT,
    images TEXT,
    video_url TEXT NOT NULL,
    copywriting TEXT,
    thumbnail TEXT,
    store_name TEXT,
    image_urls TEXT,
    created_at INTEGER NOT NULL
  )
`);
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS video_favorites (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    openid TEXT,
    video_url TEXT NOT NULL,
    thumbnail TEXT,
    title TEXT,
    author TEXT,
    avatar TEXT,
    store_name TEXT,
    cover_image TEXT,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    category TEXT,
    created_at INTEGER NOT NULL
  )
`);
const planCount = sqlite.prepare('SELECT COUNT(*) as count FROM vip_plans').get();
if (planCount.count === 0) {
    sqlite.exec(`
    INSERT INTO vip_plans (id, name, price, quota, description, duration, is_active, created_at) VALUES
    ('plan_basic', '基础版', 29900, 10, '每天10次，当天有效，第二天重置，适合轻度用户', 30, 1, datetime('now')),
    ('plan_advanced', '进阶版', 39900, 20, '每天20次，当天有效，第二天重置，适合专业用户', 30, 1, datetime('now')),
    ('plan_premium', '尊享版', 59900, -1, '30天不限次视频生成，适合重度用户', 30, 1, datetime('now'))
  `);
    console.log('[Database] 默认会员套餐已创建');
}
console.log('[Database] 数据库表创建成功');
exports.db = (0, better_sqlite3_1.drizzle)(sqlite, { schema });
__exportStar(require("./schema"), exports);
//# sourceMappingURL=index.js.map