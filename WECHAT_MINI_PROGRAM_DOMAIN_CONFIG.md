# 微信小程序域名配置指南

## 问题描述

微信小程序审核通过后，扫码却无法正常使用，主要原因：

1. **PROJECT_DOMAIN 未配置**：小程序代码中使用的后端服务器域名未正确配置
2. **微信小程序域名白名单未配置**：微信小程序要求所有网络请求的域名都必须在后台配置白名单

## 根本原因分析

### 1. PROJECT_DOMAIN 配置缺失

在 `config/index.ts` 中，`PROJECT_DOMAIN` 是通过环境变量配置的：

```typescript
defineConstants: {
  PROJECT_DOMAIN: JSON.stringify(
    process.env.PROJECT_DOMAIN ||
      process.env.COZE_PROJECT_DOMAIN_DEFAULT ||
      '',
  ),
  TARO_ENV: JSON.stringify(process.env.TARO_ENV),
},
```

如果没有设置 `PROJECT_DOMAIN` 或 `COZE_PROJECT_DOMAIN_DEFAULT`，`PROJECT_DOMAIN` 会是空字符串，导致所有 API 请求失败。

### 2. 微信小程序域名白名单限制

微信小程序安全机制要求：
- 所有网络请求的域名都必须在微信公众平台后台配置白名单
- 只能请求 HTTPS 协议的接口
- 域名必须经过 ICP 备案
- 不能请求 IP 地址或 localhost

## 解决方案

### 方案一：使用 Coze 平台部署域名（推荐）

如果你是在 Coze 平台上部署的，Coze 会提供一个域名，你需要：

1. **获取 Coze 部署域名**：
   - 在 Coze 平台的部署页面，找到部署后的服务域名
   - 域名格式通常为：`https://xxx-xxxx-xxx.coze.run` 或类似格式

2. **重新构建小程序**：
   - 设置环境变量 `COZE_PROJECT_DOMAIN_DEFAULT` 为你的 Coze 部署域名
   - 重新构建小程序

3. **在微信公众平台配置域名白名单**：
   - 登录 [微信公众平台](https://mp.weixin.qq.com/)
   - 进入"开发" > "开发管理" > "开发设置" > "服务器域名"
   - 在 `request` 和 `uploadFile` 域名白名单中添加你的 Coze 部署域名
   - 例如：`https://xxx-xxxx-xxx.coze.run`

4. **重新提交审核**：
   - 修改域名后，需要重新提交小程序审核

### 方案二：使用自己的服务器域名

如果你有自己的服务器和域名：

1. **部署后端服务**：
   - 将 NestJS 后端服务部署到你的服务器
   - 确保服务可以通过 HTTPS 访问
   - 配置 Nginx 反向代理

2. **配置 SSL 证书**：
   - 为域名配置有效的 SSL 证书（Let's Encrypt 免费证书）
   - 确保可以通过 HTTPS 访问

3. **重新构建小程序**：
   - 设置环境变量 `COZE_PROJECT_DOMAIN_DEFAULT` 为你的服务器域名
   - 例如：`https://api.yourdomain.com`

4. **在微信公众平台配置域名白名单**：
   - 在 `request` 和 `uploadFile` 域名白名单中添加你的服务器域名
   - 例如：`https://api.yourdomain.com`

5. **重新提交审核**：
   - 修改域名后，需要重新提交小程序审核

### 方案三：使用临时测试方案（仅限开发调试）

如果你只是想在开发环境中测试，可以使用微信开发者工具的"不校验合法域名"功能：

1. **打开微信开发者工具**
2. **点击右上角"详情"按钮**
3. **在"本地设置"中勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"**
4. **重新编译小程序**

⚠️ **注意**：此方案仅适用于开发调试，不能用于生产环境。

## 详细操作步骤

### 步骤 1：获取后端服务域名

#### Coze 平台部署

1. 登录 Coze 平台
2. 进入你的项目
3. 找到"部署"或"发布"页面
4. 查看部署后的服务地址（域名）
5. 记录下这个域名，格式通常是 `https://xxx-xxxx-xxx.coze.run`

#### 自己的服务器

1. 确保你的服务器可以通过公网访问
2. 配置域名解析（DNS A 记录）
3. 配置 SSL 证书
4. 确保可以通过 `https://your-domain.com` 访问

### 步骤 2：配置环境变量并重新构建

在 `.env.local` 文件中添加：

```env
# 后端服务域名（请替换为你的实际域名）
COZE_PROJECT_DOMAIN_DEFAULT=https://xxx-xxxx-xxx.coze.run
```

然后重新构建小程序：

```bash
pnpm build:weapp
```

### 步骤 3：在微信公众平台配置域名白名单

1. **登录微信公众平台**：
   - 访问 https://mp.weixin.qq.com/
   - 使用小程序管理员账号登录

2. **进入开发设置**：
   - 点击左侧菜单"开发"
   - 点击"开发管理"
   - 点击"开发设置"
   - 向下滚动找到"服务器域名"部分

3. **配置域名白名单**：
   - 在 `request` 域名白名单中添加：`https://xxx-xxxx-xxx.coze.run`
   - 在 `uploadFile` 域名白名单中添加：`https://xxx-xxxx-xxx.coze.run`
   - 在 `downloadFile` 域名白名单中添加：`https://xxx-xxxx-xxx.coze.run`（可选）
   - 点击"保存"或"修改"按钮

4. **注意事项**：
   - 域名必须以 `https://` 开头
   - 域名不能带端口号
   - 每个域名占一行
   - 修改后立即生效，无需重新审核

### 步骤 4：重新提交审核（如果域名白名单修改了）

如果域名白名单配置后小程序无法使用，可能需要重新提交审核：

1. 在微信开发者工具中上传小程序
2. 在微信公众平台提交审核
3. 等待审核通过

## 验证方法

### 方法 1：使用微信开发者工具测试

1. 打开微信开发者工具
2. 编译并预览小程序
3. 打开"调试器" > "Network" 标签
4. 测试功能，查看网络请求
5. 确认请求的 URL 是正确的域名
6. 确认请求状态为 200（成功）

### 方法 2：使用真机扫码测试

1. 在微信开发者工具中点击"预览"按钮
2. 使用微信扫描二维码
3. 在真机上测试功能
4. 检查功能是否正常

### 方法 3：查看日志

1. 打开微信开发者工具
2. 查看 Console 和 Network 标签
3. 查看是否有错误信息
4. 检查网络请求是否成功

## 常见问题

### Q1: 为什么会出现"request:fail url not in domain list"错误？

**A**: 这是因为请求的域名未在微信公众平台的"服务器域名"白名单中配置。

**解决方法**：
1. 登录微信公众平台
2. 进入"开发设置" > "服务器域名"
3. 将你的后端服务域名添加到白名单中
4. 重新编译小程序

### Q2: 为什么会出现"request:fail -2 net::ERR_NAME_NOT_RESOLVED"错误？

**A**: 这是因为域名无法解析，可能是域名配置错误或网络问题。

**解决方法**：
1. 检查域名是否正确配置
2. 检查 DNS 解析是否正常
3. 检查网络连接是否正常

### Q3: 为什么会出现"request:fail -2 net::ERR_CONNECTION_REFUSED"错误？

**A**: 这是因为后端服务未启动或无法连接。

**解决方法**：
1. 检查后端服务是否正常运行
2. 检查域名是否正确
3. 检查防火墙设置
4. 检查服务器端口是否开放

### Q4: 为什么在开发者工具中正常，但在真机上不正常？

**A**: 开发者工具默认不校验域名白名单，但真机会严格校验。

**解决方法**：
1. 在微信公众平台配置域名白名单
2. 确保使用 HTTPS 协议
3. 重新编译小程序

### Q5: 域名白名单修改后多久生效？

**A**: 域名白名单修改后立即生效，无需重新审核，但需要重新编译小程序。

## 总结

小程序扫码后无法正常使用的核心原因是：
1. **PROJECT_DOMAIN 未配置**：需要在 `.env.local` 中配置后端服务域名
2. **微信小程序域名白名单未配置**：需要在微信公众平台配置后端服务域名

解决步骤：
1. 获取后端服务域名（Coze 部署域名或自己的服务器域名）
2. 在 `.env.local` 中配置 `COZE_PROJECT_DOMAIN_DEFAULT`
3. 重新构建小程序
4. 在微信公众平台配置域名白名单
5. 重新提交审核（如果需要）

## 相关文档

- [微信小程序服务器域名配置文档](https://developers.weixin.qq.com/miniprogram/dev/framework/server-ability/network-request.html)
- [微信小程序网络请求文档](https://developers.weixin.qq.com/miniprogram/dev/api/network/request/wx.request.html)
- [Coze 平台部署文档](https://www.coze.cn/docs/)
