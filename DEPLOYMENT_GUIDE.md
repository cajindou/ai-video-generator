# 视频生成小程序 - 后端服务部署指南

## 📋 前置条件

- ✅ 服务器：阿里云 ECS（121.41.176.195）
- ✅ 域名：yuxuanbaihuo.site
- ✅ DNS：Cloudflare（已配置）
- ✅ 数据库：SQLite（自动创建）

---

## 🚀 快速部署（推荐）

### 步骤 1：登录服务器

```bash
ssh root@121.41.176.195
```

### 步骤 2：上传代码

```bash
# 在本地终端执行（非服务器）
cd /workspace/projects
scp -r . root@121.41.176.195:/root/video-app
```

### 步骤 3：执行部署脚本

```bash
# 在服务器上执行
cd /root/video-app
bash deploy_vip.sh
```

### 步骤 4：验证部署

```bash
# 测试会员套餐接口
curl https://api.yuxuanbaihuo.site/api/vip/plans

# 查看服务状态
pm2 status

# 查看服务日志
pm2 logs video-app
```

---

## 🔧 手动部署（如果自动脚本失败）

### 步骤 1：安装 Node.js 和 pnpm

```bash
# 安装 Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# 安装 pnpm
npm install -g pnpm

# 安装 PM2
npm install -g pm2
```

### 步骤 2：安装依赖

```bash
cd /root/video-app/server
pnpm install --prod
```

### 步骤 3：构建项目

```bash
pnpm build
```

### 步骤 4：配置环境变量

```bash
cd /root/video-app
cat > .env.production << 'EOF'
DATABASE_PATH=/root/video-app/data.db
NODE_ENV=production
PORT=3000
PROJECT_DOMAIN=https://api.yuxuanbaihuo.site
WECHAT_APPID=wx4b20891170ea8803
WECHAT_APPSECRET=3d5e2a08eb18366ff84c2a75d5434443
UPLOAD_DIR=/root/video-app/uploads
LOG_LEVEL=info
EOF
```

### 步骤 5：配置 Nginx

```bash
# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/video-app << 'EOF'
server {
    listen 80;
    server_name api.yuxuanbaihuo.site;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    client_max_body_size 10M;

    access_log /var/log/nginx/video-app-access.log;
    error_log /var/log/nginx/video-app-error.log;
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/video-app /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

### 步骤 6：使用 PM2 启动服务

```bash
cd /root/video-app/server
pm2 start dist/main.js --name video-app --env production
pm2 save
pm2 startup systemd -u root --hp /root
```

### 步骤 7：验证部署

```bash
# 测试接口
curl http://api.yuxuanbaihuo.site/api/vip/plans

# 如果返回 JSON 数据，说明部署成功
```

---

## 🔒 配置 HTTPS（Cloudflare）

### 方案 A：使用 Cloudflare Flexible SSL（推荐）

**优点：**
- ✅ 无需配置 SSL 证书
- ✅ Cloudflare 自动处理 HTTPS
- ✅ 简单快速

**步骤：**

1. 登录 Cloudflare 控制台
2. 进入域名 `yuxuanbaihuo.site`
3. 找到 `api` 子域名
4. 点击 `Proxy` 状态（确保是橙色的云朵图标）
5. 进入 **SSL/TLS** 页面
6. 将 **Encryption mode** 设置为 **Flexible**
7. 保存

**验证：**

```bash
curl https://api.yuxuanbaihuo.site/api/vip/plans
```

---

### 方案 B：使用 Cloudflare Origin Certificate（高级）

**步骤：**

1. 登录 Cloudflare 控制台
2. 进入 **SSL/TLS** → **Origin Server**
3. 点击 **Create Certificate**
4. 生成证书和密钥
5. 将证书和密钥上传到服务器

```bash
# 在服务器上执行
mkdir -p /etc/nginx/ssl

# 上传证书和密钥
nano /etc/nginx/ssl/cloudflare.pem  # 粘贴证书内容
nano /etc/nginx/ssl/cloudflare.key  # 粘贴密钥内容

# 修改 Nginx 配置
nano /etc/nginx/sites-available/video-app
```

**更新 Nginx 配置：**

```nginx
server {
    listen 443 ssl http2;
    server_name api.yuxuanbaihuo.site;

    ssl_certificate /etc/nginx/ssl/cloudflare.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare.key;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # ... 其他配置保持不变
}
```

**重启 Nginx：**

```bash
nginx -t
systemctl restart nginx
```

---

## 📊 API 接口测试

### 1. 获取所有会员套餐

```bash
curl https://api.yuxuanbaihuo.site/api/vip/plans
```

**预期返回：**

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": [
    {
      "id": "plan_basic",
      "name": "基础版",
      "price": 29900,
      "quota": 10,
      "description": "每天10次视频生成",
      "duration": 30,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "plan_advanced",
      "name": "进阶版",
      "price": 39900,
      "quota": 20,
      "description": "每天20次视频生成",
      "duration": 30,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "plan_premium",
      "name": "尊享版",
      "price": 59900,
      "quota": -1,
      "description": "无限次视频生成",
      "duration": 30,
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### 2. 获取用户配额信息

```bash
curl "https://api.yuxuanbaihuo.site/api/vip/quota?openid=test_openid_123"
```

**预期返回：**

```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "isVip": false,
    "totalQuota": 3,
    "usedQuotaToday": 0,
    "remainingQuota": 3,
    "vipExpireAt": null
  }
}
```

---

### 3. 手动开通会员（管理员接口）

```bash
curl -X POST https://api.yuxuanbaihuo.site/api/vip/admin/activate \
  -H "Content-Type: application/json" \
  -d '{"openid": "test_openid_123", "planId": "plan_basic"}'
```

**预期返回：**

```json
{
  "code": 200,
  "msg": "会员开通成功",
  "data": {
    "success": true,
    "userId": "user_xxx",
    "openid": "test_openid_123",
    "planName": "基础版",
    "expireAt": "2024-02-01T00:00:00.000Z"
  }
}
```

---

## 🛠️ 常见问题

### 问题 1：Nginx 启动失败

**解决方案：**

```bash
# 检查配置错误
nginx -t

# 查看错误日志
tail -f /var/log/nginx/error.log

# 修复错误后重启
systemctl restart nginx
```

---

### 问题 2：PM2 服务无法启动

**解决方案：**

```bash
# 查看错误日志
pm2 logs video-app

# 停止并重新启动
pm2 stop video-app
pm2 delete video-app
pm2 start dist/main.js --name video-app --env production
pm2 save
```

---

### 问题 3：HTTPS 连接失败

**解决方案：**

**方法 1：使用 HTTP（临时）**

```bash
curl http://api.yuxuanbaihuo.site/api/vip/plans
```

**方法 2：检查 Cloudflare 设置**

1. 确保子域名已启用 Proxy（橙色云朵）
2. 检查 SSL/TLS 模式是否设置为 **Flexible**
3. 等待 DNS 传播（可能需要 5-10 分钟）

**方法 3：检查防火墙**

```bash
# 开放 80 和 443 端口
ufw allow 80/tcp
ufw allow 443/tcp
ufw reload
```

---

## 📝 服务器信息

```
服务器 IP：121.41.176.195
域名：api.yuxuanbaihuo.site
项目路径：/root/video-app
数据库：/root/video-app/data.db
日志路径：/root/.pm2/logs/
```

---

## ✅ 部署检查清单

- [ ] DNS 解析正常（指向 121.41.176.195）
- [ ] 服务器已安装 Node.js 18.x 和 pnpm
- [ ] 项目代码已上传到服务器
- [ ] 依赖已安装
- [ ] 项目已构建
- [ ] 环境变量已配置
- [ ] Nginx 已配置
- [ ] PM2 服务已启动
- [ ] HTTPS 可访问
- [ ] API 接口测试通过

---

## 🎉 完成

部署完成后，你可以在小程序中访问会员页面，测试会员功能！

如有问题，请查看日志：
```bash
pm2 logs video-app
```
