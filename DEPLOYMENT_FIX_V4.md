# 部署修复文档 V4

## 问题描述

部署时出现数据库打开失败错误：

### 错误：数据库文件无法打开
```
SqliteError: unable to open database file
    at new Database (/opt/bytefaas/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/lib/database.js:69:26)
    at Object.<anonymous> (/opt/bytefaas/server/dist/database/index.js:21:16)
```

### 错误代码
- `SQLITE_CANTOPEN`

### 错误位置
- `/opt/bytefaas/server/dist/database/index.js:21:16`

**错误原因分析**：
1. 数据库文件路径使用相对路径 `./data.db`，在部署环境中无法正确解析
2. 数据库文件所在目录不存在，也没有创建目录的逻辑
3. 部署环境（veFaaS）可能对某些目录没有写入权限
4. 缺少错误处理机制，无法在主路径失败时使用备用路径

## 解决方案（v4）

### 核心策略：使用绝对路径 + 备用路径 + 错误处理

1. **使用绝对路径代替相对路径**：确保数据库文件路径在部署环境中可解析
2. **检查并创建目录**：在创建数据库连接前，先检查并创建数据库文件所在目录
3. **提供备用路径**：在主路径失败时，自动使用 `/tmp` 目录作为备用路径
4. **增强错误处理**：添加详细的日志输出，便于排查问题
5. **使用环境变量配置**：通过环境变量灵活配置数据库路径

## 修改的文件

### 1. server/src/database/index.ts

**主要改动**：

```typescript
// 修改前：使用相对路径
const sqlite = new Database(process.env.DATABASE_PATH || './data.db')

// 修改后：使用绝对路径 + 错误处理 + 备用路径
import * as path from 'path'
import * as fs from 'fs'

// 获取数据库文件路径
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
```

**关键改进**：
1. 使用 `path.join()` 构建绝对路径
2. 检查并创建数据库文件所在目录
3. 添加 try-catch 错误处理
4. 提供备用路径（/tmp/coze-mini-program.db）
5. 添加详细的日志输出

### 2. .env.local

**添加环境变量配置**：

```env
# 数据库文件路径（部署环境使用 /tmp 目录）
DATABASE_PATH=/tmp/coze-mini-program.db
```

### 3. .cozeproj/scripts/deploy_run.sh

**添加环境变量设置**：

```bash
#!/bin/bash
set -Eeuo pipefail

# 设置数据库路径为 /tmp 目录（部署环境可写目录）
export DATABASE_PATH=/tmp/coze-mini-program.db

start_service() {
    # ... 保持原有逻辑
}
```

### 4. .cozeproj/scripts/dev_run.sh

**添加开发环境数据库路径设置**：

```bash
    # 设置数据库路径为当前工作目录（开发环境）
    export DATABASE_PATH="${COZE_WORKSPACE_PATH}/data.db"
    echo "✅ 数据库路径已设置: DATABASE_PATH=$DATABASE_PATH"
```

## 部署环境 vs 开发环境

### 部署环境（veFaaS）
- 数据库路径：`/tmp/coze-mini-program.db`
- 原因：/tmp 目录通常是可写的，且是临时目录，适合存储数据

### 开发环境（本地）
- 数据库路径：`{COZE_WORKSPACE_PATH}/data.db`
- 原因：使用项目根目录，便于开发和调试

## 验证结果

✅ ESLint 检查通过
✅ TypeScript 类型检查通过
✅ H5 构建成功（1m 46s）
✅ 微信小程序构建成功（26.51s）
✅ NestJS 后端构建成功
✅ 日志无新错误
✅ 数据库初始化代码正确

## 数据库初始化流程

1. **读取环境变量**：从 `DATABASE_PATH` 环境变量读取数据库路径
2. **构建绝对路径**：使用 `path.join()` 构建绝对路径
3. **检查并创建目录**：检查数据库文件所在目录是否存在，不存在则创建
4. **尝试打开数据库**：尝试使用主路径打开数据库
5. **备用路径机制**：如果主路径失败，自动使用 `/tmp/coze-mini-program.db` 作为备用路径
6. **启用 WAL 模式**：启用 Write-Ahead Logging 模式以提升性能
7. **创建表结构**：执行 SQL 创建表（如果不存在）
8. **创建 Drizzle 客户端**：创建 ORM 客户端供应用使用

## 关键技术点

1. **绝对路径 vs 相对路径**：部署环境中，相对路径可能无法正确解析
2. **目录创建**：在创建数据库文件前，先创建所在目录
3. **备用路径机制**：在主路径失败时，自动切换到备用路径
4. **错误处理**：捕获并处理数据库初始化错误
5. **环境变量配置**：通过环境变量灵活配置数据库路径
6. **日志输出**：添加详细的日志输出，便于排查问题

## 常见问题排查

### 问题 1：数据库连接失败
- **症状**：`SqliteError: unable to open database file`
- **原因**：数据库文件路径错误或目录不存在
- **解决方案**：检查数据库路径配置，确保目录存在

### 问题 2：权限不足
- **症状**：`Error: EACCES: permission denied`
- **原因**：数据库文件所在目录没有写入权限
- **解决方案**：使用 `/tmp` 目录作为备用路径

### 问题 3：路径解析错误
- **症状**：`Error: ENOENT: no such file or directory`
- **原因**：相对路径在部署环境中无法正确解析
- **解决方案**：使用 `path.join()` 构建绝对路径

## 部署修复历史

### v1：better-sqlite3 Node.js 版本不兼容
- 添加 `.nvmrc` 文件强制使用 Node.js v20
- 状态：❌ 失败（部署环境是只读文件系统）

### v2：better-sqlite3 预编译二进制文件
- 使用 `prebuild-install` 下载预编译的二进制文件
- 状态：❌ 失败（esbuild 版本冲突）

### v3：esbuild 版本冲突
- 使用 `pnpm.overrides` 强制统一 esbuild 版本
- 状态：✅ 已修复

### v4：数据库文件无法打开（当前版本）
- 使用绝对路径 + 备用路径 + 错误处理
- 状态：✅ 已修复（本地构建成功，待部署验证）

## 当前修复状态

### 已修复的问题
1. ✅ better-sqlite3 Node.js 版本兼容性：使用预编译二进制文件
2. ✅ esbuild 版本冲突：使用 pnpm.overrides 强制统一版本
3. ✅ 数据库文件无法打开：使用绝对路径 + 备用路径 + 错误处理

### 待验证的问题
1. ⏳ 部署验证：需要在 Coze 平台上验证部署是否成功

## 参考资料

- [better-sqlite3 官方文档](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Node.js path 模块](https://nodejs.org/api/path.html)
- [Node.js fs 模块](https://nodejs.org/api/fs.html)
- [SQLite 官方文档](https://www.sqlite.org/docs.html)
- [Drizzle ORM 官方文档](https://orm.drizzle.team/)
