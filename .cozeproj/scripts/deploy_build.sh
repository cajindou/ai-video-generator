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
