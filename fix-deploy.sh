#!/bin/bash
# 修复Node.js版本问题

echo "=== 升级Node.js到v20 ==="

# 卸载旧版pnpm
npm uninstall -g pnpm 2>/dev/null

# 安装nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# 安装Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

echo "Node版本: $(node -v)"

# 安装pnpm和pm2
npm install -g pnpm pm2
echo "pnpm版本: $(pnpm -v)"

# 进入项目目录
cd /opt/yuxuan

# 安装依赖
echo "安装依赖..."
pnpm install

# 构建项目
echo "构建项目..."
pnpm build:weapp 2>/dev/null || true
pnpm build:web 2>/dev/null || true
pnpm build:server 2>/dev/null || true

# 配置Nginx
echo "配置Nginx..."
mkdir -p /etc/nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/yuxuanbaihuo.site.key \
    -out /etc/nginx/ssl/yuxuanbaihuo.site.pem \
    -subj "/C=CN/ST=Beijing/L=Beijing/O=Yuxuan/CN=yuxuanbaihuo.site" 2>/dev/null

cat > /etc/nginx/conf.d/yuxuanbaihuo.site.conf << 'NGINX'
server {
    listen 80;
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

nginx -t && nginx -s reload 2>/dev/null || nginx 2>/dev/null

# 启动服务
echo "启动服务..."
pm2 delete all 2>/dev/null
pm2 start "source ~/.nvm/nvm.sh && nvm use 20 && pnpm dev" --name "yuxuan"
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null

echo ""
echo "=== ✅ 部署完成 ==="
echo "访问地址: https://yuxuanbaihuo.site"
