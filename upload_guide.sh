#!/bin/bash

set -e

SERVER_HOST="47.238.239.28"
SERVER_USER="root"
SERVER_PASS="j021990J@"
LOCAL_FILE="/workspace/projects/compiled-dist.tar.gz"
REMOTE_DIR="/root/ai-video-generator"
REMOTE_FILE="$REMOTE_DIR/server/dist.tar.gz"

echo "=== 步骤1: 通过 VNC/Workbench 上传文件到服务器 ==="
echo "请使用以下方式上传文件到服务器："
echo "1. 打开阿里云控制台 → ECS 实例 → 连接 → Workbench/VNC"
echo "2. 将 /workspace/projects/compiled-dist.tar.gz 上传到 /root/ai-video-generator/server/dist.tar.gz"
echo ""
echo "或者，如果可以执行 curl 命令："
echo "在沙箱环境执行："
echo "  base64 /workspace/projects/compiled-dist.tar.gz > /tmp/dist.b64"
echo "  cat /tmp/dist.b64"
echo "然后在服务器执行："
echo "  echo '<base64内容>' | base64 -d > /root/ai-video-generator/server/dist.tar.gz"
