# 明天待办事项清单

## 当前状态（已完成）
- ✅ 香港服务器（47.238.239.28）已部署
- ✅ Docker容器已启动
- ✅ Nginx已配置
- ✅ API服务正常运行
- ✅ 外部可直接访问：http://47.238.239.28/api/hello

---

## 明天需要做的事情

### 1. 修改 Cloudflare DNS 配置（必须）

**操作步骤**：
1. 登录 Cloudflare：https://dash.cloudflare.com/
2. 选择域名 `yuxuanbaihuo.site`
3. 进入 **DNS** → **记录**
4. 找到 A 记录，修改为：
   ```
   类型: A
   名称: @
   内容: 47.238.239.28  （香港服务器IP）
   代理状态: 已代理（橙色云图标）
   ```
5. 如果有 www 记录，同样修改为 `47.238.239.28`

**SSL设置**：
- 进入 **SSL/TLS** → **概述**
- 设置为 **Full** 模式

---

### 2. 更新微信公众平台 IP 白名单（必须）

**操作步骤**：
1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入 **开发** → **开发管理** → **开发设置**
3. 找到 **IP白名单**
4. 添加以下IP：
   ```
   47.238.239.28（香港服务器IP）
   ```
5. 如果之前添加过Cloudflare IP，可以保留或删除

---

### 3. 测试小程序功能

完成上述配置后，在微信开发者工具测试：

1. **登录功能**：点击登录按钮，确认能获取用户信息
2. **图片上传**：选择3-5张图片上传
3. **视频生成**：点击生成视频，等待AI生成

---

### 4. 小程序代码修改（如需要）

如果域名访问正常但小程序无法连接，可能需要修改 `src/network/index.ts`：

```typescript
// 检查 BASE_URL 是否正确
const BASE_URL = 'https://yuxuanbaihuo.site'
```

---

## 服务器信息

| 项目 | 信息 |
|-----|------|
| 香港服务器IP | 47.238.239.28 |
| SSH密码 | 15881509700..wen |
| 后端端口 | 3000 |
| 前端目录 | /var/www/html |
| 上传目录 | /root/ai-video-generator/uploads |
| Docker容器名 | ai-video-generator |

---

## 常用命令

```bash
# SSH连接香港服务器
ssh root@47.238.239.28

# 查看容器状态
docker ps

# 查看容器日志
docker logs ai-video-generator --tail 50

# 重启容器
docker restart ai-video-generator

# 查看Nginx状态
systemctl status nginx

# 重启Nginx
systemctl restart nginx

# 测试API
curl http://localhost/api/hello
```

---

## 问题排查

### 如果域名无法访问
1. 检查DNS是否指向 47.238.239.28
2. 检查Cloudflare SSL是否为Full模式
3. 用 `nslookup yuxuanbaihuo.site` 验证DNS

### 如果小程序登录失败
1. 检查微信公众平台IP白名单是否包含 47.238.239.28
2. 检查微信AppID和AppSecret是否正确
3. 查看服务器日志：`docker logs ai-video-generator --tail 50`

### 如果图片上传失败
1. 检查上传目录权限：`ls -la /root/ai-video-generator/uploads/`
2. 检查Nginx配置中的 `client_max_body_size`

---

## 备注

- 香港服务器**无需ICP备案**，可直接使用域名
- Cloudflare提供免费SSL证书和CDN加速
- 小程序正式发布前需要在微信公众平台配置服务器域名
