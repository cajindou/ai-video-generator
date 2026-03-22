#!/bin/bash
# ========================================
# 智能图片分析功能 - 一键部署脚本
# 在服务器上执行此脚本
# ========================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     智能图片分析功能 - 自动部署到生产服务器               ║"
echo "╚════════════════════════════════════════════════════════════╝"

PROJECT_DIR="/root/ai-video-generator"

# 1. 进入项目目录
echo ""
echo "【1/6】进入项目目录..."
cd $PROJECT_DIR
echo "✅ 当前目录: $(pwd)"

# 2. 拉取最新代码
echo ""
echo "【2/6】拉取最新代码..."
git fetch origin
git checkout fresh-main 2>/dev/null || git checkout -b fresh-main origin/fresh-main
git reset --hard origin/fresh-main
echo "✅ 代码已更新"

# 3. 安装依赖
echo ""
echo "【3/6】安装依赖..."
cd server
pnpm install --silent 2>/dev/null || pnpm install
echo "✅ 依赖安装完成"

# 4. 编译项目
echo ""
echo "【4/6】编译后端服务..."
pnpm build
echo "✅ 编译完成"

# 5. 重启容器
echo ""
echo "【5/6】重启 Docker 容器..."
cd $PROJECT_DIR
docker compose down
docker compose build --no-cache
docker compose up -d
echo "✅ 容器已重启"

# 6. 验证部署
echo ""
echo "【6/6】验证部署..."
sleep 5

# 检查容器状态
if docker ps | grep -q ai-video-generator; then
    echo "✅ 容器运行正常"
else
    echo "❌ 容器未运行，请检查日志"
    docker compose logs
    exit 1
fi

# 检查新功能是否生效
echo ""
echo "========================================="
echo "🎉 部署完成！"
echo "========================================="
echo ""
echo "新功能："
echo "- AI 智能分析所有图片"
echo "- 自动选择最佳首帧图片"
echo "- 根据图片内容智能分配展示场景"
echo "- 移除 FFmpeg 备选方案"
echo ""
echo "测试命令："
echo "curl http://localhost:3000/api/hello"
echo ""
