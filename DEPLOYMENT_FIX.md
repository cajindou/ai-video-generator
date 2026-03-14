# 部署错误修复文档

## 问题描述

部署时出现以下错误：

### 错误 1：Node.js 版本不兼容

```
The module '/opt/bytefaas/node_modules/.pnpm/better-sqlite3@11.10.0/node_modules/better-sqlite3/build/Release/better_sqlite3.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 137. This version of Node.js requires
NODE_MODULE_VERSION 115.
```

### 错误 2：只读文件系统

```
EROFS: read-only file system, open '/opt/bytefaas/_tmp_39_19f9d24c45fe7aca31b1fb22f9c6373c'
gyp ERR! clean error
gyp ERR! stack Error: EROFS: read-only file system, rmdir 'build'
```

**错误原因**：
- better-sqlite3 是原生 C++ 模块，需要在编译和运行时使用相同的 Node.js 版本
- 编译时使用的是 Node.js v22.x（NODE_MODULE_VERSION 137）
- 运行时使用的是 Node.js v20.19.6（NODE_MODULE_VERSION 115）
- 版本不兼容导致二进制模块加载失败
- 部署环境的文件系统是只读的，无法在运行时重新编译模块

## 解决方案

### 核心策略：构建阶段强制使用 Node.js v20

由于部署环境的文件系统是只读的，不能在运行时重新编译模块。因此，必须在构建阶段确保 better-sqlite3 使用正确的 Node.js 版本（v20）编译。

### 1. 添加 `.nvmrc` 文件

在项目根目录添加 `.nvmrc` 文件，强制指定 Node.js 版本为 v20：

```bash
20
```

**作用**：
- nvm（Node Version Manager）会自动切换到指定的 Node.js 版本
- 确保开发和部署环境使用一致的 Node.js 版本

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

### 3. 修改构建脚本 `deploy_build.sh` ✅

在构建前检查 Node.js 版本，并强制重新编译 better-sqlite3：

```bash
#!/bin/bash
set -Eeuo pipefail

cd "${COZE_WORKSPACE_PATH}"

# ---------------------------------------------------------
# 检查并强制使用 Node.js v20
# ---------------------------------------------------------
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Current Node.js version: ${NODE_VERSION}"

if [[ ! "${NODE_VERSION}" =~ ^v20\. ]]; then
    echo "⚠️  Warning: Current Node.js version is ${NODE_VERSION}, but better-sqlite3 requires Node.js v20"
    echo "🔄 Attempting to switch to Node.js v20..."

    # 尝试使用 nvm 切换版本
    if command -v nvm &> /dev/null; then
        echo "Using nvm to switch to Node.js v20..."
        nvm use 20 || nvm install 20
        node -v
    # 尝试使用 n 切换版本
    elif command -v n &> /dev/null; then
        echo "Using n to switch to Node.js v20..."
        n 20 || n lts
        node -v
    else
        echo "⚠️  Warning: Neither nvm nor n is available. Cannot switch Node.js version."
        echo "⚠️  better-sqlite3 may fail to compile or load if versions don't match."
    fi
fi

echo "Installing dependencies..."
pnpm install

# ---------------------------------------------------------
# 强制重新编译 better-sqlite3 以匹配当前 Node.js 版本
# ---------------------------------------------------------
echo "🔨 Rebuilding better-sqlite3 for Node.js $(node -v)..."
cd "${COZE_WORKSPACE_PATH}/server"
pnpm rebuild better-sqlite3 || npm rebuild better-sqlite3
cd "${COZE_WORKSPACE_PATH}"

echo "Building the Taro project..."
pnpm build
```

**作用**：
- 在构建阶段检查 Node.js 版本，如果不是 v20，尝试切换
- 在安装依赖后强制重新编译 better-sqlite3
- 确保编译的二进制模块与运行时版本匹配

### 4. 修改部署运行脚本 `deploy_run.sh` ✅

**移除**运行时的重新编译逻辑（因为文件系统是只读的）：

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

**作用**：
- 避免在只读文件系统中尝试重新编译
- 直接启动服务，依赖构建阶段编译好的模块

### 5. 修改开发脚本 `dev_run.sh`

在安装依赖前检查并重新编译 better-sqlite3：

```bash
echo "🔍 Checking Node.js version..."
NODE_VERSION=$(node -v)
echo "Current Node.js version: ${NODE_VERSION}"

# 检查是否为 Node.js v20
if [[ ! "${NODE_VERSION}" =~ ^v20\. ]]; then
    echo "⚠️  Warning: Rebuilding better-sqlite3 for current Node.js version..."
    cd server
    pnpm rebuild better-sqlite3 || npm rebuild better-sqlite3
    cd ..
fi
```

**作用**：
- 在开发环境自动检测和修复版本不兼容问题
- 确保本地开发环境正常工作

## 验证步骤

### 1. 本地验证

```bash
# 检查 Node.js 版本
node -v  # 应该输出 v20.x.x

# 安装依赖
pnpm install

# 重新编译 better-sqlite3
cd server
pnpm rebuild better-sqlite3
cd ..

# 启动开发服务器
coze dev
```

### 2. 部署验证

```bash
# 提交代码并部署
git add .
git commit -m "fix: 修复 better-sqlite3 部署时的只读文件系统错误"
git push
```

部署时检查日志，确保：
- 构建阶段 better-sqlite3 被正确重新编译
- 服务启动成功，没有版本不兼容错误
- 数据库连接正常

## Node.js 版本对照表

| Node.js 版本 | NODE_MODULE_VERSION |
|-------------|-------------------|
| v20.19.6    | 115               |
| v22.12.0    | 137               |

## 关键变更说明

### 变更前（❌ 失败）

**构建阶段**：
- 使用 Node.js v22.x 编译 better-sqlite3
- 生成与 v22.x 兼容的二进制模块

**运行阶段**：
- 使用 Node.js v20.x 运行服务
- 尝试重新编译 better-sqlite3
- **失败**：文件系统是只读的，无法重新编译

### 变更后（✅ 成功）

**构建阶段**：
- 强制使用 Node.js v20.x 编译 better-sqlite3
- 生成与 v20.x 兼容的二进制模块
- 在可写文件系统中完成编译

**运行阶段**：
- 使用 Node.js v20.x 运行服务
- 直接使用编译好的模块，无需重新编译
- **成功**：版本匹配，模块正常加载

## 注意事项

1. **版本一致性**：确保所有环境（开发、构建、运行）使用相同的 Node.js 版本
2. **构建阶段编译**：必须在构建阶段重新编译原生模块，而不是运行时
3. **只读文件系统**：部署环境可能是只读的，不能依赖运行时的文件写入操作
4. **CI/CD 配置**：在 CI/CD 流程中添加 Node.js 版本检查和强制切换步骤
5. **团队协作**：在 README 中明确说明项目要求的 Node.js 版本

## 备选方案

如果问题依然存在，可以考虑以下替代方案：

### 方案 1：使用 better-sqlite3 的预编译二进制文件

```bash
npm install better-sqlite3 --build-from-source=false
```

**限制**：预编译二进制文件可能不支持所有平台和 Node.js 版本

### 方案 2：切换到其他数据库

- 使用 PostgreSQL（Drizzle ORM + pg）
- 使用 MySQL（Drizzle ORM + mysql2）
- 使用内存数据库（Redis）

**优点**：不需要原生模块，避免版本兼容性问题

**缺点**：需要修改大量代码，迁移成本高

### 方案 3：使用 Docker 容器化部署

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN pnpm install
COPY . .
RUN pnpm build
CMD ["node", "server/dist/main.js"]
```

**优点**：完全控制 Node.js 版本和构建环境

**缺点**：需要调整部署流程

### 方案 4：使用 sql.js（纯 JavaScript SQLite）

```bash
pnpm remove better-sqlite3
pnpm add sql.js
```

**优点**：纯 JavaScript 实现，不需要编译

**缺点**：
- 性能比 better-sqlite3 差
- API 不兼容，需要修改大量代码
- 数据库文件格式可能不同

## 参考资料

- [better-sqlite3 官方文档](https://github.com/WiseLibs/better-sqlite3)
- [Node.js ABI 版本对照表](https://nodejs.org/en/docs/es6/node-addon-api/)
- [NVM 使用指南](https://github.com/nvm-sh/nvm)
- [Coze 部署文档](https://docs.coze.com/docs/deploy_guide)
