# FFmpeg 参数修复方案

## 问题原因
`fluent-ffmpeg` 的 `.inputFormat('lavfi')` 方法生成了错误的命令行参数：
```
Unrecognized option 'f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100'
```

## 修复内容
将 `.inputFormat('lavfi')` 替换为 `.inputOptions(['-f lavfi'])`

---

## 一键修复命令（在服务器上执行）

```bash
# SSH 登录服务器后执行以下命令
ssh root@47.238.239.28

# 一键修复脚本
docker exec ai-video-generator sed -i "s/.inputFormat('lavfi')/.inputOptions(['-f lavfi'])/g" /app/server/dist/video/video.service.js && \
docker restart ai-video-generator && \
echo "修复完成!" && \
sleep 5 && \
docker logs --tail 30 ai-video-generator
```

---

## 分步执行方案

### 1. 登录服务器
```bash
ssh root@47.238.239.28
```

### 2. 进入容器检查问题
```bash
docker exec -it ai-video-generator bash
which ffmpeg
ffmpeg -version
cat /app/server/dist/video/video.service.js | grep -A2 "anullsrc"
```

### 3. 修复文件
```bash
# 方法一: 使用 sed 直接修复
docker exec ai-video-generator sed -i "s/.inputFormat('lavfi')/.inputOptions(['-f lavfi'])/g" /app/server/dist/video/video.service.js

# 方法二: 如果 sed 失败，复制出来修复后复制回去
docker cp ai-video-generator:/app/server/dist/video/video.service.js /tmp/video.service.js
sed -i "s/.inputFormat('lavfi')/.inputOptions(['-f lavfi'])/g" /tmp/video.service.js
docker cp /tmp/video.service.js ai-video-generator:/app/server/dist/video/video.service.js
```

### 4. 验证修复
```bash
docker exec ai-video-generator cat /app/server/dist/video/video.service.js | grep "inputOptions"
```

预期输出应包含：
```javascript
.inputOptions(['-f lavfi'])
```

### 5. 重启容器
```bash
docker restart ai-video-generator
```

### 6. 查看日志确认
```bash
docker logs -f --tail 50 ai-video-generator
```

---

## 测试视频生成

修复完成后，调用 API 测试：
```bash
curl -X POST https://yuxuanbaihuo.site/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrls": [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ],
    "customInput": "测试视频生成"
  }'
```

---

## 源代码已修复

本地源代码已修复，位于:
- `server/src/video/video.service.ts`
- `server/dist/video/video.service.js`

修复内容:
- 第 789-792 行: 多图轮播视频生成
- 第 842-845 行: 单图视频生成

如果需要完整重新部署，请将 `server/dist` 目录上传到服务器。
