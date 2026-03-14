#!/bin/bash

# AI视频生成小程序 - 自动部署脚本
# 使用预编译的产物，避免服务器GLIBC版本问题

set -e

echo "========================================="
echo "开始部署 AI 视频生成小程序"
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
echo "✅ 代码已更新"

# 解压编译产物（覆盖旧的dist目录）
echo "📦 解压编译产物..."
tar -xzf compiled-dist.tar.gz
echo "✅ 编译产物已解压"

# 删除旧的 Dockerfile（如果存在）
echo "🗑️  准备修改 Dockerfile..."
rm -f Dockerfile

# 创建新的 Dockerfile（不包含编译步骤）
cat > Dockerfile << 'EOF'
# 使用 Node.js 20 (Debian 基础镜像)
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 使用阿里云 Debian 镜像源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装系统依赖（better-sqlite3 和 FFmpeg 需要）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    curl \
    ffmpeg \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# 创建上传目录
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# 复制所有 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY pnpm-workspace.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装所有依赖
RUN pnpm install

# 复制所有源文件（包括预编译的 dist 目录）
COPY . .

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

# 启动应用
CMD ["node", "server/dist/main.js"]
EOF

echo "✅ Dockerfile 已更新"

# 构建镜像（使用缓存，不重新编译）
echo "🔨 开始构建 Docker 镜像（使用预编译产物，约2-3分钟）..."
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
