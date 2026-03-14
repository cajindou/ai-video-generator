# 完整部署命令（复制粘贴到服务器执行）

## 方法1：一行命令部署（推荐）

```bash
cd /root/ai-video-generator/server && pnpm build && cd /root/ai-video-generator && docker compose up -d --force-recreate && sleep 5 && docker compose logs --tail 30
```

## 方法2：分步部署

```bash
# 步骤1：编译
cd /root/ai-video-generator/server
pnpm build

# 步骤2：重启容器
cd /root/ai-video-generator
docker compose up -d --force-recreate

# 步骤3：查看日志
docker compose logs --tail 30

# 步骤4：测试视频生成
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
```

## 方法3：使用部署脚本

```bash
# 创建脚本
cat > /root/deploy.sh << 'EOFSCRIPT'
#!/bin/bash
cd /root/ai-video-generator/server
pnpm build
cd /root/ai-video-generator
docker compose up -d --force-recreate
sleep 5
docker compose logs --tail 30
EOFSCRIPT

# 执行脚本
bash /root/deploy.sh

# 测试
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
```
