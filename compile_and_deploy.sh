#!/bin/bash

set -e

SERVER_HOST="47.238.239.28"
SERVER_USER="root"
SERVER_PASS="j021990J@"
PROJECT_DIR="/root/ai-video-generator"

echo "=== 在服务器上重新编译代码 ==="

# 创建编译脚本
cat > /tmp/server_compile.sh << 'EOF'
set -e
cd /root/ai-video-generator

# 检查并修复 package.json
if ! grep -q '"@types/fluent-ffmpeg"' server/package.json; then
    echo "添加缺失的依赖..."
    cd server && pnpm add -D @types/fluent-ffmpeg
fi

# 重新编译
echo "开始编译..."
cd server && pnpm build

# 检查编译结果
if [ -d "dist" ] && [ -f "dist/video/video.service.js" ]; then
    echo "✅ 编译成功"
else
    echo "❌ 编译失败"
    exit 1
fi
EOF

# 上传编译脚本
echo "上传编译脚本..."
sshpass -p "$SERVER_PASS" scp -o StrictHostKeyChecking=no /tmp/server_compile.sh root@$SERVER_HOST:/tmp/server_compile.sh

# 执行编译
echo "执行编译..."
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "bash /tmp/server_compile.sh"

echo "=== 编译完成，重启容器 ==="

# 重启容器
sshpass -p "$SERVER_PASS" ssh -o StrictHostKeyChecking=no root@$SERVER_HOST "cd $PROJECT_DIR && docker compose up -d --force-recreate"

echo "✅ 部署完成"
