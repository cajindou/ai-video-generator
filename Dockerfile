# 使用 Node.js 20 (Debian 基础镜像)
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 使用阿里云 Debian 镜像源
RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources || \
    sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list

# 安装系统依赖（better-sqlite3 和 FFmpeg 需要）
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    sqlite3 \
    curl \
    ffmpeg \
    fonts-dejavu \
    && rm -rf /var/lib/apt/lists/*

# 创建上传目录
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# 复制所有 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./
COPY server/package.json ./server/
COPY pnpm-workspace.yaml ./

# 安装 pnpm
RUN npm install -g pnpm

# 安装所有依赖（不使用 --ignore-scripts，因为 better-sqlite3 需要编译）
RUN pnpm install

# 复制所有源文件（不包括编译后的 dist）
COPY . .

# 编译 TypeScript 代码（确保使用最新代码）
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV UPLOAD_DIR=/app/uploads

# 启动应用
CMD ["node", "server/dist/main.js"]
