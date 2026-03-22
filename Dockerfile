# 使用 Node.js 20 (Debian 基础镜像，包含完整编译工具链)
FROM node:20

# 设置工作目录
WORKDIR /app

# 使用阿里云 Debian 镜像源加速
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources 2>/dev/null || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null || true

# 安装 FFmpeg 和字体（视频生成必需）
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    ffmpeg \
    fonts-dejavu \
    fonts-wqy-zenhei \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# 创建上传目录
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# 复制依赖配置文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY server/package.json ./server/

# 安装 pnpm
RUN npm install -g pnpm

# 安装依赖（better-sqlite3 会自动编译）
RUN pnpm install

# 复制源代码和编译产物
COPY server/ ./server/

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

# 启动应用
CMD ["node", "server/dist/main.js"]
