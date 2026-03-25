#!/bin/bash
# 部署脚本 - 在服务器上执行
# 用法: bash deploy.sh

set -e

echo "=== 开始部署 ==="

# 进入项目目录
cd /root/ai-video-generator

# 拉取最新代码
echo ">>> 拉取最新代码..."
git fetch origin
git reset --hard origin/main

# 停止旧容器
echo ">>> 停止旧容器..."
docker compose down

# 重新构建镜像
echo ">>> 构建新镜像..."
docker compose build --no-cache

# 启动新容器
echo ">>> 启动新容器..."
docker compose up -d

# 等待服务启动
echo ">>> 等待服务启动..."
sleep 10

# 检查服务状态
echo ">>> 检查服务状态..."
docker compose ps

# 检查日志
echo ">>> 最新日志..."
docker compose logs --tail=20

echo "=== 部署完成 ==="
