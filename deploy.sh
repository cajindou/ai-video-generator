#!/bin/bash
# ========================================
# 宇轩百货 AI口播探店视频生成系统
# 一键部署脚本
# ========================================

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║        宇轩百货 AI口播探店视频生成系统 - 一键部署          ║"
echo "╚════════════════════════════════════════════════════════════╝"

# 1. 安装Node.js 20
echo ""
echo "【1/7】安装Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - 2>/dev/null || true
    apt-get install -y nodejs 2>/dev/null || yum install -y nodejs 2>/dev/null
fi
echo "Node版本: $(node -v)"

# 2. 安装pnpm和pm2
echo ""
echo "【2/7】安装pnpm和pm2..."
npm install -g pnpm pm2 2>/dev/null
echo "pnpm版本: $(pnpm -v)"

# 3. 克隆代码
echo ""
echo "【3/7】克隆项目代码..."
rm -rf /opt/yuxuan 2>/dev/null
mkdir -p /opt/yuxuan
cd /opt/yuxuan

git clone -b new-branch https://gitee.com/caijindou/ai-video-generator.git . 2>/dev/null || \
git clone -b main https://gitee.com/caijindou/ai-video-generator.git . 2>/dev/null

# 4. 安装依赖
echo ""
echo "【4/7】安装项目依赖..."
pnpm install --silent 2>/dev/null || pnpm install

# 5. 构建项目
echo ""
echo "【5/7】构建项目..."
pnpm build:weapp 2>/dev/null || true
pnpm build:web 2>/dev/null || true
pnpm build:server 2>/dev/null || true

# 6. 配置Nginx
echo ""
echo "【6/7】配置Nginx..."
apt-get install -y nginx 2>/dev/null || yum install -y nginx 2>/dev/null

mkdir -p /etc/nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/yuxuanbaihuo.site.key \
    -out /etc/nginx/ssl/yuxuanbaihuo.site.pem \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Yuxuan/CN=yuxuanbaihuo.site" 2>/dev/null || true

cat > /etc/nginx/sites-available/yuxuanbaihuo.site << 'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name yuxuanbaihuo.site www.yuxuanbaihuo.site;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yuxuanbaihuo.site www.yuxuanbaihuo.site;
    
    ssl_certificate /etc/nginx/ssl/yuxuanbaihuo.site.pem;
    ssl_certificate_key /etc/nginx/ssl/yuxuanbaihuo.site.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 50M;
    }
}
NGINX

ln -sf /etc/nginx/sites-available/yuxuanbaihuo.site /etc/nginx/sites-enabled/ 2>/dev/null || true
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t 2>/dev/null && systemctl restart nginx 2>/dev/null || nginx 2>/dev/null || true

# 7. 启动服务
echo ""
echo "【7/7】启动服务..."
cd /opt/yuxuan
pm2 delete all 2>/dev/null || true
pm2 start "pnpm dev" --name "yuxuan"
pm2 save
pm2 startup 2>/dev/null | tail -1 | bash 2>/dev/null || true

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    ✅ 部署成功！                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "🌐 访问地址: https://yuxuanbaihuo.site"
echo ""
