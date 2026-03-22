#!/bin/bash

# =====================================================
# AI视频生成小程序 - 自动部署脚本
# =====================================================

set -e  # 遇到错误立即退出

echo "========================================="
echo "开始自动部署 AI 视频生成小程序"
echo "========================================="

# 进入项目目录
cd ~/ai-video-generator
echo "✅ 已进入项目目录"

# 停止并删除旧容器
echo "📦 停止旧容器..."
docker compose down || true
echo "✅ 旧容器已停止"

# 删除旧镜像
echo "🗑️  删除旧镜像..."
docker rmi ai-video-fixed -f || true
echo "✅ 旧镜像已删除"

# 拉取最新代码
echo "📥 拉取最新代码..."
git fetch origin
git reset --hard origin/main
echo "✅ 代码已更新到最新版本"

# 使用缓存构建镜像（避免OOM）
echo "🔨 开始构建 Docker 镜像（使用缓存，大约3-5分钟）..."
docker compose build

# 启动容器
echo "🚀 启动容器..."
docker compose up -d
echo "✅ 容器已启动"

# 等待容器启动
echo "⏳ 等待容器启动..."
sleep 10

# 验证代码更新
echo "🔍 验证代码更新..."
if docker exec ai-video-generator grep -q "generateCompleteVideoWithFFmpeg" /app/server/dist/video/video.service.js; then
    echo "✅ 部署成功！新代码已生效"
    echo ""
    echo "========================================="
    echo "部署完成！"
    echo "========================================="
    echo ""
    echo "验证结果："
    docker exec ai-video-generator grep -n "generateCompleteVideoWithFFmpeg" /app/server/dist/video/video.service.js | head -2
    echo ""
    echo "容器状态："
    docker ps | grep ai-video-generator
else
    echo "❌ 部署失败！新代码未生效"
    echo "请检查容器日志："
    docker compose logs
    exit 1
fi

echo ""
echo "🎉 自动部署完成！"
