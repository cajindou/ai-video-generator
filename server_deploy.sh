#!/bin/bash

set -e

echo "========================================="
echo "  AI 视频生成器 - 自动部署脚本"
echo "========================================="

PROJECT_DIR="/root/ai-video-generator"

echo ""
echo "【步骤 1/5】进入项目目录..."
cd $PROJECT_DIR

echo ""
echo "【步骤 2/5】检查源代码是否存在..."
if [ ! -d "server/src" ]; then
    echo "❌ 源代码不存在，请先上传源代码"
    exit 1
fi
echo "✅ 源代码存在"

echo ""
echo "【步骤 3/5】修复 FFmpeg 音频参数错误..."
cd server
# 检查是否需要修复
if ! grep -q "inputFormat('lavfi')" src/video/video.service.ts; then
    echo "修复 FFmpeg 音频参数..."
    sed -i "s/'-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100',/\.input('anullsrc=channel_layout=stereo:sample_rate=44100')\n        \.inputFormat('lavfi')/g" src/video/video.service.ts
    echo "✅ 修复完成"
else
    echo "✅ 已修复"
fi

echo ""
echo "【步骤 4/5】重新编译..."
pnpm install 2>&1 | tail -5
pnpm build 2>&1 | tail -10

echo ""
echo "【步骤 5/5】重启容器..."
cd $PROJECT_DIR
docker compose up -d --force-recreate

echo ""
echo "等待容器启动..."
sleep 5

echo ""
echo "========================================="
echo "  部署完成！检查容器状态..."
echo "========================================="
docker ps | grep ai-video-generator

echo ""
echo "========================================="
echo "  查看最新日志"
echo "========================================="
docker compose logs --tail 30

echo ""
echo "========================================="
echo "  测试视频生成功能"
echo "========================================="
echo "请执行以下命令测试："
echo ""
cat << 'EOF'
curl -X POST http://localhost:3000/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "images": [
      "https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F2da27abc327ec927ff12de0a64891d41.jpg&nonce=9add2dd7-7761-4d19-abaa-a9843f1e1f56&project_id=7612318003925139494&sign=23356fe25c1578dc2e4d8546a0ea1c4656ed1394fa2db19c2e8dda2af9cccc3a",
      "https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F9a3a1d1b5f2b699520c3d9b96c0be565.jpg&nonce=791d4fc9-297f-4fe8-9fe4-1842f57d7f01&project_id=7612318003925139494&sign=a3de062f8a0fb3f73037295072700039125a766532a6eb7934ee8b00ae7c53c5",
      "https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F54b529829802ff9a44defbd4ce94d0c2.jpg&nonce=b1dc7eb1-930e-4032-a7b1-206902e7fc9f&project_id=7612318003925139494&sign=eb30fc3fa8f0084c1ebc1bc99c57d120f1df05c7747736fac07f40d952c87726"
    ],
    "storeName": "测试探店",
    "openid": "test_user_001"
  }'
EOF

echo ""
echo "========================================="
echo "  部署脚本执行完毕"
echo "========================================="
