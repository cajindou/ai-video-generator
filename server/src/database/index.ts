import { drizzle } from 'drizzle-orm/better-sqlite3'
// 修复 better-sqlite3 导入问题
const Database = require('better-sqlite3')
import * as schema from './schema'
import * as path from 'path'
import * as fs from 'fs'

// 获取数据库文件路径
// 优先使用环境变量，否则使用工作目录下的 data.db
const defaultDbPath = path.join(process.cwd(), 'data.db')
const dbPath = process.env.DATABASE_PATH || defaultDbPath

// 确保数据库文件所在目录存在
const dbDir = path.dirname(dbPath)
try {
  if (!fs.existsSync(dbDir)) {
    console.log(`[Database] 创建数据库目录: ${dbDir}`)
    fs.mkdirSync(dbDir, { recursive: true })
  }
} catch (error) {
  console.error('[Database] 创建数据库目录失败:', error)
}

// 创建数据库连接（带错误处理和备用路径）
let sqlite
try {
  console.log(`[Database] 尝试打开数据库: ${dbPath}`)
  sqlite = new Database(dbPath, { verbose: console.log })
  console.log(`[Database] 数据库连接成功: ${dbPath}`)
} catch (error) {
  console.error('[Database] 数据库连接失败:', error.message)
  
  // 尝试使用备用路径（/tmp 目录）
  const fallbackPath = path.join('/tmp', 'coze-mini-program.db')
  console.log(`[Database] 尝试使用备用路径: ${fallbackPath}`)
  
  try {
    // 确保目录存在
    const fallbackDir = path.dirname(fallbackPath)
    if (!fs.existsSync(fallbackDir)) {
      fs.mkdirSync(fallbackDir, { recursive: true })
    }
    
    sqlite = new Database(fallbackPath, { verbose: console.log })
    console.log(`[Database] 备用路径连接成功: ${fallbackPath}`)
  } catch (fallbackError) {
    console.error('[Database] 备用路径连接失败:', fallbackError.message)
    throw new Error(`数据库初始化失败: ${fallbackError.message}`)
  }
}

// 启用 WAL 模式（Write-Ahead Logging）以提升性能
sqlite.pragma('journal_mode = WAL')

// 创建表（如果不存在）- 与 schema 定义保持一致
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
`)

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
`)

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
`)

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
`)

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
`)

// 插入默认会员套餐（如果不存在）
const planCount = sqlite.prepare('SELECT COUNT(*) as count FROM vip_plans').get()
if (planCount.count === 0) {
  sqlite.exec(`
    INSERT INTO vip_plans (id, name, price, quota, description, duration, is_active, created_at) VALUES
    ('plan_basic', '基础版', 29900, 10, '每天10次，当天有效，第二天重置，适合轻度用户', 30, 1, datetime('now')),
    ('plan_advanced', '进阶版', 39900, 20, '每天20次，当天有效，第二天重置，适合专业用户', 30, 1, datetime('now')),
    ('plan_premium', '尊享版', 59900, -1, '30天不限次视频生成，适合重度用户', 30, 1, datetime('now'))
  `)
  console.log('[Database] 默认会员套餐已创建')
}

console.log('[Database] 数据库表创建成功')

// 创建 Drizzle 客户端
export const db = drizzle(sqlite, { schema })

// 数据库导出
export * from './schema'
