#!/bin/bash

# ============================================
# 视频生成小程序后端服务 - VIP功能部署脚本
# ============================================

set -e

echo "=========================================="
echo "开始部署视频生成小程序后端服务（VIP功能）"
echo "=========================================="

# 进入项目目录
cd /root/video-app

# ============================================
# 步骤 1：备份现有数据
# ============================================
echo ""
echo "步骤 1/6：备份现有数据..."

if [ -f "data.db" ]; then
  cp data.db data.db.backup.$(date +%Y%m%d_%H%M%S)
  echo "✅ 数据库已备份"
else
  echo "⚠️  数据库文件不存在，跳过备份"
fi

# ============================================
# 步骤 2：安装依赖
# ============================================
echo ""
echo "步骤 2/6：安装依赖..."

cd server
pnpm install --prod
echo "✅ 依赖安装完成"

# ============================================
# 步骤 3：构建项目
# ============================================
echo ""
echo "步骤 3/6：构建项目..."

pnpm build
echo "✅ 项目构建完成"

# ============================================
# 步骤 4：配置环境变量
# ============================================
echo ""
echo "步骤 4/6：配置环境变量..."

cat > /root/video-app/.env.production << 'EOF'
# 数据库配置
DATABASE_PATH=/root/video-app/data.db

# 项目配置
NODE_ENV=production
PORT=3000

# 域名配置
PROJECT_DOMAIN=https://api.yuxuanbaihuo.site

# 微信小程序配置
WECHAT_APPID=wx4b20891170ea8803
WECHAT_APPSECRET=3d5e2a08eb18366ff84c2a75d5434443

# 上传目录配置
UPLOAD_DIR=/root/video-app/uploads

# Coze API 配置
COZE_API_KEY=your_coze_api_key
COZE_BOT_ID=your_coze_bot_id

# 日志配置
LOG_LEVEL=info
EOF

echo "✅ 环境变量配置完成"

# ============================================
# 步骤 5：配置 Nginx
# ============================================
echo ""
echo "步骤 5/6：配置 Nginx..."

cat > /etc/nginx/sites-available/video-app << 'EOF'
server {
    listen 80;
    server_name api.yuxuanbaihuo.site;

    # 强制跳转到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yuxuanbaihuo.site;

    # SSL 证书配置（Cloudflare 提供的证书）
    # 注意：如果使用 Cloudflare 的 Flexible SSL 模式，证书会自动处理
    ssl_certificate /etc/nginx/ssl/cloudflare.pem;
    ssl_certificate_key /etc/nginx/ssl/cloudflare.key;

    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 反向代理到 Node.js 服务
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

    # 上传文件大小限制
    client_max_body_size 10M;

    # 日志
    access_log /var/log/nginx/video-app-access.log;
    error_log /var/log/nginx/video-app-error.log;
}
EOF

# 创建 SSL 证书目录
mkdir -p /etc/nginx/ssl

# 启用站点
ln -sf /etc/nginx/sites-available/video-app /etc/nginx/sites-enabled/

# 测试 Nginx 配置
nginx -t

# 重启 Nginx
systemctl restart nginx

echo "✅ Nginx 配置完成"

# ============================================
# 步骤 6：配置 PM2
# ============================================
echo ""
echo "步骤 6/6：配置 PM2..."

# 停止现有服务
pm2 stop video-app || true
pm2 delete video-app || true

# 启动新服务
cd /root/video-app/server
pm2 start dist/main.js --name video-app --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup systemd -u root --hp /root

echo "✅ PM2 配置完成"

# ============================================
# 部署完成
# ============================================
echo ""
echo "=========================================="
echo "✅ 后端服务部署完成！"
echo "=========================================="
echo ""
echo "服务状态："
pm2 status

echo ""
echo "服务日志："
pm2 logs video-app --lines 20 --nostream

echo ""
echo "测试接口："
echo "curl https://api.yuxuanbaihuo.site/api/vip/plans"
echo ""
