#!/bin/bash
# 宇轩百货 - CentOS 7 兼容部署脚本

echo "=== 🔧 CentOS 7 兼容部署 ==="

# 检查系统版本
cat /etc/centos-release 2>/dev/null || cat /etc/redhat-release 2>/dev/null

# 使用预编译的Node.js 16 (兼容CentOS 7)
echo ""
echo "【1/6】安装Node.js 16 (兼容CentOS 7)..."

# 卸载之前的nvm安装
rm -rf ~/.nvm 2>/dev/null

# 使用NodeSource安装Node.js 16
curl -fsSL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs

echo "Node版本: $(node -v)"

# 安装pnpm和pm2
echo ""
echo "【2/6】安装pnpm和pm2..."
npm install -g pnpm@8 pm2

echo "pnpm版本: $(pnpm -v)"

# 克隆代码
echo ""
echo "【3/6】克隆项目代码..."
rm -rf /opt/yuxuan 2>/dev/null
mkdir -p /opt/yuxuan
cd /opt/yuxuan

git clone -b new-branch https://gitee.com/caijindou/ai-video-generator.git . 2>/dev/null || git clone https://gitee.com/caijindou/ai-video-generator.git .

# 安装依赖
echo ""
echo "【4/6】安装项目依赖..."
pnpm install --no-optional 2>/dev/null || pnpm install

# 构建项目
echo ""
echo "【5/6】构建项目..."
pnpm build:server 2>/dev/null || true

# 配置Nginx
echo ""
echo "【6/6】配置Nginx..."
yum install -y nginx 2>/dev/null || true

mkdir -p /etc/nginx/ssl

openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/yuxuanbaihuo.site.key \
    -out /etc/nginx/ssl/yuxuanbaihuo.site.pem \
    -subj "/C=CN/ST=Beijing/O=Yuxuan/CN=yuxuanbaihuo.site" 2>/dev/null

cat > /etc/nginx/conf.d/yuxuan.conf << 'NGINX'
server {
    listen 80;
    server_name yuxuanbaihuo.site www.yuxuanbaihuo.site;
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name yuxuanbaihuo.site www.yuxuanbaihuo.site;
    
    ssl_certificate /etc/nginx/ssl/yuxuanbaihuo.site.pem;
    ssl_certificate_key /etc/nginx/ssl/yuxuanbaihuo.site.key;
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }
}
NGINX

nginx -t && systemctl restart nginx

# 启动服务
echo ""
echo "启动服务..."
cd /opt/yuxuan
pm2 delete all 2>/dev/null
pm2 start "pnpm dev:server" --name api
pm2 start "pnpm dev:web" --name web
pm2 save
pm2 startup | tail -1 | bash 2>/dev/null

echo ""
echo "=== ✅ 部署完成 ==="
echo "访问: https://yuxuanbaihuo.site"
