#!/bin/bash

# AI 视频生成器 - 一键部署脚本
# 生成时间: $(date)

echo "======================================"
echo "  AI 视频生成器 - 一键部署"
echo "======================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查是否在正确目录
if [ ! -d "ai-video-generator" ]; then
    cd ~/ai-video-generator || {
        echo -e "${RED}❌ 无法进入 ai-video-generator 目录${NC}"
        exit 1
    }
fi

echo "✅ 进入项目目录: $(pwd)"
echo ""

# 步骤1: 拉取最新代码
echo "📥 步骤1: 拉取最新代码..."
git fetch origin
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git fetch 失败${NC}"
    exit 1
fi

git reset --hard origin/main
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Git reset 失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 代码拉取成功${NC}"
echo ""

# 步骤2: 停止旧容器
echo "🛑 步骤2: 停止旧容器..."
docker-compose down
if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  停止容器时出现警告，继续...${NC}"
fi
echo -e "${GREEN}✅ 容器已停止${NC}"
echo ""

# 步骤3: 重新构建镜像
echo "🔨 步骤3: 重新构建镜像（不使用缓存）..."
echo -e "${YELLOW}⏳ 这可能需要几分钟，请耐心等待...${NC}"
docker-compose build --no-cache
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 镜像构建失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 镜像构建成功${NC}"
echo ""

# 步骤4: 启动容器
echo "🚀 步骤4: 启动容器..."
docker-compose up -d
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 容器启动失败${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 容器已启动${NC}"
echo ""

# 步骤5: 等待容器完全启动
echo "⏳ 步骤5: 等待容器完全启动（30秒）..."
sleep 30

# 步骤6: 验证代码是否更新
echo "🔍 步骤6: 验证代码是否更新..."
echo ""
docker exec ai-video-generator grep -n "generateCompleteVideoWithFFmpeg\|buildConcatFilter" /app/server/dist/video.service.js

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}======================================"
    echo "  ✅ 部署成功！"
    echo "======================================"
    echo ""
    echo "代码已更新为最新版本（一次性生成30秒完整视频）"
    echo ""
    echo "📋 下一步："
    echo "  1. 在小程序中上传3张图片"
    echo "  2. 触发视频生成"
    echo "  3. 观察日志输出："
    echo ""
    echo "     docker logs -f ai-video-generator"
    echo ""
else
    echo ""
    echo -e "${RED}======================================"
    echo "  ❌ 部署失败"
    echo "======================================"
    echo ""
    echo "代码未更新成功，请检查日志："
    echo "  docker logs ai-video-generator"
    echo ""
fi

echo ""
echo "======================================"
echo "  部署完成"
echo "======================================"
