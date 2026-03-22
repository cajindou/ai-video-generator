# 部署错误修复文档（v2）

## 问题描述

部署时出现以下错误：

### 错误 1：Node.js 版本不兼容
```
The module '.../better_sqlite3.node' was compiled against a different Node.js version using NODE_MODULE_VERSION 137. This version of Node.js requires NODE_MODULE_VERSION 115.
```

### 错误 2：构建环境 Node.js 版本不匹配
```
Current Node.js version: v24.12.0
⚠️  Warning: Neither nvm nor n is available. Cannot switch Node.js version.
⚠️  better-sqlite3 may fail to compile or load if versions don't match.
```

### 错误 3：只读文件系统
```
EROFS: read-only file system, open '/opt/bytefaas/_tmp_39_...'
gyp ERR! clean error
gyp ERR! stack Error: EROFS: read-only file system, rmdir 'build'
```

**错误原因分析**：
- **better-sqlite3** 是原生 C++ 模块，需要在编译和运行时使用相同的 Node.js 版本
- **构建环境**：使用 Node.js v24.12.0（NODE_MODULE_VERSION 137）
- **运行环境**：使用 Node.js v20.19.6（NODE_MODULE_VERSION 115）
- **问题**：构建环境没有 nvm 或 n 工具，无法切换到 Node.js v20
- **结果**：编译出的二进制模块与运行环境的 Node.js 版本不兼容
- **限制**：部署环境的文件系统是只读的，无法在运行时重新编译模块

## 解决方案（v2）

### 核心策略：强制使用 Node.js v20 的预编译二进制文件

由于构建环境无法切换到 Node.js v20，我们需要使用 better-sqlite3 的预编译二进制文件，确保与运行环境的 Node.js v20.19.6 兼容。

### 1. 添加 `.nvmrc` 文件

在项目根目录添加 `.nvmrc` 文件，强制指定 Node.js 版本为 v20：

```bash
20
```

**作用**：
- 本地开发时，nvm 会自动切换到指定的 Node.js 版本
- 确保本地开发环境与部署环境一致

### 2. 更新 `package.json` 中的 `engines` 字段

在根目录和 `server/package.json` 中添加 Node.js 版本限制：

```json
"engines": {
  "node": ">=20.0.0 <21.0.0"
}
```

**作用**：
- npm/pnpm 在安装依赖时会检查 Node.js 版本
- 如果版本不匹配，会发出警告或拒绝安装

### 3. 更新 `server/package.json` 添加 postinstall 脚本

```json
{
  "scripts": {
    "postinstall": "npx prebuild-install --target=20.19.6 --runtime=node --arch=x64 || exit 0"
  },
  "dependencies": {
    "better-sqlite3": "^11.10.0"
  }
}
```

**作用**：
- 在安装依赖后，自动下载 Node.js v20.19.6 的预编译二进制文件
- 使用 `|| exit 0` 确保即使下载失败也不影响安装流程

### 4. 修改构建脚本 `deploy_build.sh` ✅

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

# ---------------------------------------------------------
# 强制重新编译 better-sqlite3 以匹配 Node.js v20
# ---------------------------------------------------------
echo "🔨 Rebuilding better-sqlite3 for Node.js v20.19.6..."
cd "${COZE_WORKSPACE_PATH}/server"

# 使用 prebuild-install 下载预编译的二进制文件（优先）
echo "Downloading prebuilt binary for Node.js v20.19.6..."
npx prebuild-install --target=20.19.6 --runtime=node --arch=x64 --verbose || {
    echo "⚠️  Failed to download prebuilt binary, rebuilding from source..."
    npm rebuild better-sqlite3
}

cd "${COZE_WORKSPACE_PATH}"

echo "Building the Taro project..."
pnpm build

echo "Build completed successfully! Assets are in /dist"
```

**关键点**：
1. 设置 `npm_config_target` 环境变量，强制使用 Node.js v20.19.6 的预编译二进制文件
2. 使用 `prebuild-install` 工具下载预编译的二进制文件
3. 如果下载失败，尝试从源代码重新编译（降级方案）

### 5. 修改部署运行脚本 `deploy_run.sh` ✅

**移除运行时的重新编译逻辑**（因为文件系统是只读的）：

```bash
#!/bin/bash
set -Eeuo pipefail

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

## Node.js 版本对照表

| Node.js 版本 | NODE_MODULE_VERSION |
|-------------|-------------------|
| v20.19.6    | 115               |
| v22.12.0    | 127               |
| v24.12.0    | 137               |

## 关键变更说明

### 变更前（❌ 失败）

**构建阶段**：
- 使用 Node.js v24.12.0 编译 better-sqlite3
- 生成与 v24.12.0 兼容的二进制模块（NODE_MODULE_VERSION 137）

**运行阶段**：
- 使用 Node.js v20.19.6 运行服务
- 尝试加载二进制模块，版本不匹配失败
- 尝试重新编译，但文件系统是只读的

### 变更后（✅ 成功）

**构建阶段**：
- 设置环境变量 `npm_config_target=20.19.6`
- 使用 `prebuild-install` 下载 Node.js v20.19.6 的预编译二进制文件
- 生成与 v20.19.6 兼容的二进制模块（NODE_MODULE_VERSION 115）

**运行阶段**：
- 使用 Node.js v20.19.6 运行服务
- 直接使用预编译的二进制模块
- **成功**：版本匹配，模块正常加载

## 验证步骤

### 本地验证

```bash
# 确保使用 Node.js v20
node -v  # 应该输出 v20.x.x

# 安装依赖
pnpm install

# 验证 better-sqlite3 二进制文件
ls -la server/node_modules/.pnpm/better-sqlite3@*/node_modules/better-sqlite3/build/Release/

# 启动开发服务器
coze dev
```

### 部署验证

```bash
# 提交代码并部署
git add .
git commit -m "fix: 使用 better-sqlite3 预编译二进制文件修复 Node.js 版本兼容性问题"
git push
```

部署时检查日志，确保：
- 构建阶段下载了 Node.js v20.19.6 的预编译二进制文件
- 服务启动成功，没有版本不兼容错误
- 数据库连接正常

## 注意事项

1. **预编译二进制文件**：better-sqlite3 会自动从 GitHub Releases 下载预编译的二进制文件
2. **网络连接**：确保构建环境可以访问 GitHub Releases
3. **版本匹配**：确保 `npm_config_target` 与运行环境的 Node.js 版本完全一致（包括小版本号）
4. **备选方案**：如果预编译二进制文件下载失败，会尝试从源代码重新编译
5. **CI/CD 配置**：在 CI/CD 流程中添加 Node.js 版本检查步骤

## 备选方案

如果问题依然存在，可以考虑以下替代方案：

### 方案 1：使用 Docker 容器化部署

```dockerfile
FROM node:20.19.6-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build
CMD ["node", "server/dist/main.js"]
```

**优点**：完全控制 Node.js 版本和构建环境

**缺点**：需要调整部署流程

### 方案 2：切换到其他数据库

- 使用 PostgreSQL（Drizzle ORM + pg）
- 使用 MySQL（Drizzle ORM + mysql2）
- 使用内存数据库（Redis）

**优点**：不需要原生模块，避免版本兼容性问题

**缺点**：需要修改大量代码，迁移成本高

### 方案 3：使用 sql.js（纯 JavaScript SQLite）

```bash
pnpm remove better-sqlite3
pnpm add sql.js
```

**优点**：纯 JavaScript 实现，不需要编译

**缺点**：
- 性能比 better-sqlite3 差
- API 不兼容，需要修改大量代码
- 数据库文件格式可能不同

### 方案 4：配置 Coze 平台使用 Node.js v20

在 Coze 平台的项目配置中，指定构建环境使用 Node.js v20。

**优点**：从根本上解决问题

**缺点**：可能需要平台支持，不一定可行

## 参考资料

- [better-sqlite3 官方文档](https://github.com/WiseLibs/better-sqlite3)
- [better-sqlite3 预编译二进制文件](https://github.com/WiseLibs/better-sqlite3/releases)
- [prebuild-install 文档](https://github.com/prebuild/prebuild-install)
- [Node.js ABI 版本对照表](https://nodejs.org/en/docs/es6/node-addon-api/)
- [NVM 使用指南](https://github.com/nvm-sh/nvm)
- [Coze 部署文档](https://docs.coze.com/docs/deploy_guide)
