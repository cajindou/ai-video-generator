# 部署错误修复总结

## 概述

本文档总结了项目在部署过程中遇到的所有错误及其修复方案。

## 修复历史

### v1：better-sqlite3 Node.js 版本不兼容（初始版本）

**问题描述**：
- 构建时使用 Node.js v22.x，运行时使用 Node.js v20.x
- better-sqlite3 二进制模块版本不匹配

**修复方案**：
- 添加 `.nvmrc` 文件强制使用 Node.js v20
- 在 `deploy_run.sh` 中添加重新编译逻辑
- 在 `dev_run.sh` 中添加版本检查和重新编译逻辑

**状态**：❌ 失败（部署环境是只读文件系统）

### v2：better-sqlite3 预编译二进制文件

**问题描述**：
- 构建环境使用 Node.js v24.12.0，运行环境使用 Node.js v20.19.6
- 构建环境没有 nvm 或 n 工具，无法切换版本

**修复方案**：
- 设置环境变量 `npm_config_target=20.19.6`
- 使用 `prebuild-install` 下载预编译的二进制文件
- 在 `server/package.json` 中添加 `postinstall` 脚本

**状态**：❌ 失败（esbuild 版本冲突）

### v3：esbuild 版本冲突

**问题描述**：
- 项目中同时存在 esbuild 0.18.20 和 0.21.5
- 版本冲突导致构建失败

**修复方案**：
- 在 `package.json` 中添加 `pnpm.overrides` 强制统一 esbuild 版本
- 选择 esbuild 0.18.20（与 vite 4.x 兼容）

**状态**：✅ 已修复

### v4：数据库文件无法打开

**问题描述**：
- 部署时出现 `SqliteError: unable to open database file` 错误
- 数据库文件路径使用相对路径，在部署环境中无法正确解析
- 数据库文件所在目录不存在，也没有创建目录的逻辑

**修复方案**：
- 使用绝对路径代替相对路径
- 检查并创建数据库文件所在目录
- 提供备用路径（/tmp 目录）
- 增强错误处理和日志输出
- 使用环境变量配置数据库路径

**状态**：✅ 已修复（本地构建成功，待部署验证）

### v5：better-sqlite3 重新编译失败

**问题描述**：
- 部署时出现 better-sqlite3 重新编译失败错误
- `deploy_build.sh` 中的重新编译逻辑触发了二次编译
- 第一次编译使用 Node.js v20.19.6 成功，第二次编译使用 v24.12.0 失败
- 两次编译导致构建文件损坏

**修复方案**：
- 移除 `deploy_build.sh` 中的重新编译逻辑
- 依赖 `pnpm install` 自动处理 better-sqlite3 编译
- 保留环境变量设置，确保预编译二进制文件使用正确的版本

**状态**：✅ 已修复（本地构建成功，待部署验证）

## 当前状态

### 已修复的问题

1. ✅ **better-sqlite3 Node.js 版本兼容性**：使用预编译二进制文件
2. ✅ **esbuild 版本冲突**：使用 pnpm.overrides 强制统一版本
3. ✅ **数据库文件无法打开**：使用绝对路径 + 备用路径 + 错误处理
4. ✅ **better-sqlite3 重新编译失败**：移除重新编译逻辑

### 待验证的问题

1. ⏳ **部署验证**：需要在 Coze 平台上验证部署是否成功

## 完整修复列表

### 1. `.nvmrc`

```bash
20
```

### 2. `package.json`（根目录）

```json
{
  "engines": {
    "node": ">=20.0.0 <21.0.0",
    "pnpm": ">=9.0.0"
  },
  "pnpm": {
    "overrides": {
      "esbuild": "0.18.20"
    }
  }
}
```

### 3. `server/package.json`

```json
{
  "scripts": {
    "postinstall": "npx prebuild-install --target=20.19.6 --runtime=node --arch=x64 || exit 0"
  },
  "dependencies": {
    "better-sqlite3": "^11.10.0"
  },
  "engines": {
    "node": ">=20.0.0 <21.0.0"
  },
  "pnpm": {
    "overrides": {
      "esbuild": "0.18.20"
    }
  }
}
```

### 4. `.cozeproj/scripts/deploy_build.sh`

```bash
#!/bin/bash
set -Eeuo pipefail

cd "${COZE_WORKSPACE_PATH}"

if [ -f "./.cozeproj/scripts/init_env.sh" ]; then
    echo "⚙️ Initializing environment..."
    bash ./.cozeproj/scripts/init_env.sh
else
    echo "⚠️ Warning: init_env.sh not found, skipping environment init."
fi

echo "🔍 Current Node.js version: $(node -v)"

# 设置环境变量，强制使用 Node.js v20.19.6 的预编译二进制文件
export npm_config_target=20.19.6
export npm_config_target_arch=x64
export npm_config_runtime=node

echo "Installing dependencies..."
pnpm install

# 注意：better-sqlite3 的预编译二进制文件已在 pnpm install 时下载和配置
# 无需在构建阶段重新编译，避免 Node.js 版本不匹配问题

echo "Building the Taro project..."
pnpm build

echo "Build completed successfully! Assets are in /dist"
```

### 5. `.cozeproj/scripts/deploy_run.sh`

```bash
#!/bin/bash
set -Eeuo pipefail

# 设置数据库路径为 /tmp 目录（部署环境可写目录）
export DATABASE_PATH=/tmp/coze-mini-program.db

start_service() {
    cd "${COZE_WORKSPACE_PATH}/server/dist"

    local port="${DEPLOY_RUN_PORT:-3000}"
    echo "Starting Static File Server on port ${port} for deploy..."

    cd "${COZE_WORKSPACE_PATH}/server/dist"
    node ./main.js -p "${port}"
}

echo "Starting HTTP service for deploy..."
start_service
```

### 6. `.cozeproj/scripts/dev_run.sh`

添加 Node.js 版本检查逻辑。

### 7. `server/src/database/index.ts`

使用绝对路径 + 备用路径 + 错误处理初始化数据库：

```typescript
import * as path from 'path'
import * as fs from 'fs'

// 获取数据库文件路径
const defaultDbPath = path.join(process.cwd(), 'data.db')
const dbPath = process.env.DATABASE_PATH || defaultDbPath

// 确保数据库文件所在目录存在
const dbDir = path.dirname(dbPath)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// 创建数据库连接（带错误处理和备用路径）
let sqlite
try {
  sqlite = new Database(dbPath, { verbose: console.log })
  console.log(`[Database] 数据库连接成功: ${dbPath}`)
} catch (error) {
  // 尝试使用备用路径（/tmp 目录）
  const fallbackPath = path.join('/tmp', 'coze-mini-program.db')
  const fallbackDir = path.dirname(fallbackPath)
  if (!fs.existsSync(fallbackDir)) {
    fs.mkdirSync(fallbackDir, { recursive: true })
  }
  sqlite = new Database(fallbackPath, { verbose: console.log })
  console.log(`[Database] 备用路径连接成功: ${fallbackPath}`)
}
```

### 8. `.env.local`

添加数据库路径环境变量：

```env
DATABASE_PATH=/tmp/coze-mini-program.db
```

## 验证清单

部署前请确保以下所有检查项都通过：

- [x] ESLint 检查通过
- [x] TypeScript 类型检查通过
- [x] H5 构建成功
- [x] 微信小程序构建成功
- [x] NestJS 后端构建成功
- [x] 日志无新错误
- [x] esbuild 版本统一
- [ ] 部署到 Coze 平台成功
- [ ] 服务启动成功
- [ ] 数据库连接正常
- [ ] API 接口正常响应

## 参考资料

- [DEPLOYMENT_FIX.md](./DEPLOYMENT_FIX.md) - v1 版本修复方案
- [DEPLOYMENT_FIX_V2.md](./DEPLOYMENT_FIX_V2.md) - v2 版本修复方案（better-sqlite3 预编译二进制文件）
- [DEPLOYMENT_FIX_V3.md](./DEPLOYMENT_FIX_V3.md) - v3 版本修复方案（esbuild 版本冲突）
- [DEPLOYMENT_FIX_V4.md](./DEPLOYMENT_FIX_V4.md) - v4 版本修复方案（数据库文件无法打开）
- [DEPLOYMENT_FIX_V5.md](./DEPLOYMENT_FIX_V5.md) - v5 版本修复方案（better-sqlite3 重新编译失败）
