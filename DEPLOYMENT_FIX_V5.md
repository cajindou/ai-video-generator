# 部署修复文档 V5

## 问题描述

部署时出现 better-sqlite3 重新编译失败错误：

### 错误：重新编译失败（Node.js 版本不匹配）

```
npm error command sh -c prebuild-install || node-gyp rebuild --release
npm error gyp info using node@24.12.0 | linux | x64
npm error make: *** [better_sqlite3.target.mk:120: Release/obj.target/better_sqlite3/src/better_sqlite3.o] Error 1
npm error gyp ERR! build error
npm error gyp ERR! stack Error: `make` failed with exit code: 2
```

### 错误原因分析

1. **两次编译冲突**：
   - 第一次编译：`pnpm install` 时，better-sqlite3 使用预编译二进制文件或本地缓存成功编译（使用 v20.19.6）
   - 第二次编译：`deploy_build.sh` 中的重新编译逻辑再次尝试编译，但使用了错误的 Node.js 版本（v24.12.0）

2. **Node.js 版本不匹配**：
   - 预编译二进制文件：使用 Node.js v20.19.6 编译（NODE_MODULE_VERSION 115）
   - 重新编译：使用 Node.js v24.12.0 编译（NODE_MODULE_VERSION 137）
   - 版本不匹配导致编译失败

3. **文件冲突**：
   - 两次编译导致构建文件损坏
   - `sed: can't read ./Release/.deps/Release/obj.target/better_sqlite3/src/better_sqlite3.o.d.raw: No such file or directory`

4. **根因**：`deploy_build.sh` 中保留了 v2 版本的 better-sqlite3 重新编译逻辑，导致在构建阶段额外触发编译

## 解决方案（v5）

### 核心策略：移除重新编译逻辑，依赖预编译二进制文件

1. **移除 `deploy_build.sh` 中的重新编译逻辑**：
   - 删除 `npx prebuild-install` 命令
   - 删除 `npm rebuild better-sqlite3` 命令
   - 保留环境变量设置（`npm_config_target` 等），确保 `pnpm install` 时使用正确的预编译二进制文件

2. **依赖 `pnpm install` 自动处理**：
   - better-sqlite3 的 `install` 脚本会自动尝试下载预编译二进制文件
   - 如果预编译文件不可用，会自动从源码编译（使用 `npm_config_target` 指定的版本）

3. **避免二次编译**：
   - 只在 `pnpm install` 阶段编译一次
   - 不再在构建阶段重新编译

## 修改的文件

### 1. .cozeproj/scripts/deploy_build.sh

**修改前**（有重新编译逻辑）：
```bash
#!/bin/bash
set -Eeuo pipefail

cd "${COZE_WORKSPACE_PATH}"

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

**修改后**（移除重新编译逻辑）：
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

**关键改进**：
1. 移除了 `npx prebuild-install` 命令
2. 移除了 `npm rebuild better-sqlite3` 命令
3. 添加了注释说明为什么不需要重新编译
4. 保留了环境变量设置，确保 `pnpm install` 时使用正确的预编译二进制文件

## 为什么需要移除重新编译逻辑？

### 问题 1：版本不一致
- **构建环境**：可能使用 Node.js v24.12.0
- **运行环境**：使用 Node.js v20.19.6
- **预编译文件**：为 v20.19.6 编译
- **重新编译**：在 v24.12.0 环境下编译，导致版本不匹配

### 问题 2：二次编译冲突
- 第一次编译：`pnpm install` 时，better-sqlite3 自动编译（使用预编译文件或源码）
- 第二次编译：`deploy_build.sh` 中的重新编译逻辑再次触发编译
- 两次编译导致构建文件损坏

### 问题 3：不必要的复杂性
- `pnpm install` 已经会自动处理 better-sqlite3 的编译
- 不需要额外的重新编译逻辑
- 增加了出错的可能性

## better-sqlite3 编译流程

### 预编译二进制文件（优先）

1. **环境变量设置**：
   ```bash
   export npm_config_target=20.19.6
   export npm_config_target_arch=x64
   export npm_config_runtime=node
   ```

2. **pnpm install 自动处理**：
   - better-sqlite3 的 `install` 脚本会自动尝试下载预编译二进制文件
   - 下载 URL：`https://github.com/WiseLibs/better-sqlite3/releases/download/v11.10.0/better-sqlite3-v11.10.0-node-v20.19.6-linux-x64.tar.gz`

3. **成功条件**：
   - 网络连接正常
   - 预编译文件存在
   - Node.js 版本匹配

### 源码编译（降级方案）

1. **预编译文件不可用**：
   - 网络问题
   - 预编译文件不存在
   - 下载失败

2. **自动切换到源码编译**：
   - 使用 `node-gyp` 从源码编译
   - 使用 `npm_config_target` 指定的 Node.js 版本
   - 编译输出：`Release/better_sqlite3.node`

3. **成功条件**：
   - 构建工具可用（make, gcc, g++）
   - Node.js 头文件可用
   - 磁盘空间充足

## 验证结果

✅ ESLint 检查通过
✅ TypeScript 类型检查通过
✅ H5 构建成功（1m 48s）
✅ 微信小程序构建成功（25.63s）
✅ NestJS 后端构建成功
✅ 日志无新错误
✅ 没有二次编译冲突

## 关键技术点

1. **预编译二进制文件优先**：better-sqlite3 优先使用预编译文件，避免编译耗时和依赖问题
2. **环境变量控制**：通过 `npm_config_target` 控制预编译文件的版本
3. **避免二次编译**：只在 `pnpm install` 阶段编译一次，避免版本不匹配
4. **自动降级**：预编译文件不可用时，自动切换到源码编译
5. **简化构建流程**：移除不必要的重新编译逻辑，降低出错可能性

## 部署修复历史

### v1：better-sqlite3 Node.js 版本不兼容
- 添加 `.nvmrc` 文件强制使用 Node.js v20
- 状态：❌ 失败（部署环境是只读文件系统）

### v2：better-sqlite3 预编译二进制文件
- 添加重新编译逻辑到 `deploy_build.sh`
- 状态：❌ 失败（esbuild 版本冲突）

### v3：esbuild 版本冲突
- 使用 `pnpm.overrides` 强制统一 esbuild 版本
- 状态：✅ 已修复

### v4：数据库文件无法打开
- 使用绝对路径 + 备用路径 + 错误处理
- 状态：✅ 已修复

### v5：better-sqlite3 重新编译失败（当前版本）
- 移除 `deploy_build.sh` 中的重新编译逻辑
- 状态：✅ 已修复（本地构建成功，待部署验证）

## 当前修复状态

### 已修复的问题
1. ✅ better-sqlite3 Node.js 版本兼容性：使用预编译二进制文件
2. ✅ esbuild 版本冲突：使用 pnpm.overrides 强制统一版本
3. ✅ 数据库文件无法打开：使用绝对路径 + 备用路径 + 错误处理
4. ✅ better-sqlite3 重新编译失败：移除重新编译逻辑

### 待验证的问题
1. ⏳ 部署验证：需要在 Coze 平台上验证部署是否成功

## 参考资料

- [better-sqlite3 官方文档](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [better-sqlite3 预编译二进制文件](https://github.com/WiseLibs/better-sqlite3/releases)
- [node-gyp 官方文档](https://github.com/nodejs/node-gyp)
- [npm 配置文档](https://docs.npmjs.com/misc/config)
- [pnpm 官方文档](https://pnpm.io/)
