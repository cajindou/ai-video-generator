请在服务器上执行以下命令：

## 方法1：使用 curl 下载文件（推荐）

```bash
cd /root/ai-video-generator/server
rm -rf dist.bak 2>/dev/null
mv dist dist.bak 2>/dev/null
curl -o dist.tar.gz http://localhost:5000/compiled-dist.tar.gz
tar -xzf dist.tar.gz
rm dist.tar.gz
```

## 方法2：手动上传

如果 curl 不可用，请手动上传文件：

1. 在沙箱环境中，使用以下命令查看文件：
   ```bash
   ls -lh /workspace/projects/compiled-dist.tar.gz
   ```

2. 使用 VNC/Workbench 连接到服务器
3. 将文件从沙箱环境复制到服务器的 `/root/ai-video-generator/server/dist.tar.gz`
4. 执行解压命令：
   ```bash
   cd /root/ai-video-generator/server
   rm -rf dist.bak 2>/dev/null
   mv dist dist.bak 2>/dev/null
   tar -xzf dist.tar.gz
   rm dist.tar.gz
   ```

## 方法3：使用 Python HTTP 服务器上传（如果可用）

在沙箱环境启动临时服务器：
```bash
cd /workspace/projects
python3 -m http.server 8080
```

然后在服务器上下载：
```bash
cd /root/ai-video-generator/server
curl -O http://<沙箱IP>:8080/compiled-dist.tar.gz
tar -xzf compiled-dist.tar.gz
rm compiled-dist.tar.gz
```

---

上传完成后，执行以下命令重新编译：

```bash
cd /root/ai-video-generator/server
pnpm build
```

然后重启容器：

```bash
cd /root/ai-video-generator
docker compose up -d --force-recreate
```
