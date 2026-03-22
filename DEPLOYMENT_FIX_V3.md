# 部署错误修复文档（v3）

## 问题描述

部署时出现 esbuild 版本冲突错误：

### 错误：esbuild 版本冲突
```
Error: Expected "0.21.5" but got "0.18.20"
at validateBinaryVersion (/tmp/workdir/node_modules/.pnpm/esbuild@0.21.5/node_modules/esbuild/install.js:133:11)
```

### 错误：小程序构建失败
```
build miniprogram failed, exit code: 1
```

**错误原因分析**：
- 项目中同时存在多个版本的 esbuild（0.18.20 和 0.21.5）
- vite 4.5.14 依赖 esbuild 0.18.20
- 其他依赖（可能是 @swc/core 或其他工具）引入了 esbuild 0.21.5
- pnpm 的 workspace 配置导致依赖版本不一致
- esbuild 在安装时检测到版本不匹配，抛出错误

## 解决方案（v3）

### 核心策略：使用 pnpm.overrides 强制统一 esbuild 版本

在 package.json 中添加 `pnpm.overrides` 配置，强制所有依赖使用相同版本的 esbuild。

### 1. 更新根目录 `package.json`

添加 `pnpm.overrides` 配置：

```json
{
  "packageManager": "pnpm@9.0.0",
  "engines": {
    "node": ">=20.0.0 <21.0.0",
    "pnpm": ">=9.0.0"
  },
  "pnpm": {
    "overrides": {
      "esbuild": "0.18.20"
    }
  }
}
```

### 2. 更新 `server/package.json`

同样添加 `pnpm.overrides` 配置：

```json
{
  "engines": {
    "node": ">=20.0.0 <21.0.0"
  },
  "pnpm": {
    "overrides": {
      "esbuild": "0.18.20"
    }
  }
}
```

### 3. 为什么选择 esbuild 0.18.20？

- **vite 4.5.14** 依赖 esbuild 0.18.20
- **@tarojs/vite-runner 4.1.9** 依赖 esbuild 0.18.20
- 选择与主要构建工具（vite）兼容的版本

### 4. pnpm.overrides 的工作原理

`pnpm.overrides` 是 pnpm 的一个功能，允许你强制指定某个依赖的版本，覆盖所有传递依赖的版本要求。

**作用**：
- 确保整个项目只使用一个版本的 esbuild
- 避免版本冲突
- 减少依赖体积

**示例**：
```json
{
  "pnpm": {
    "overrides": {
      "esbuild": "0.18.20",
      "react": "18.3.1"
    }
  }
}
```

## 验证步骤

### 本地验证

```bash
# 清理依赖（可选）
rm -rf node_modules pnpm-lock.yaml
rm -rf server/node_modules server/pnpm-lock.yaml

# 重新安装依赖
pnpm install

# 检查 esbuild 版本
pnpm list esbuild

# 构建项目
pnpm build
```

### 验证 esbuild 版本统一

```bash
# 检查所有 esbuild 版本
find node_modules -name "esbuild" -type d -execdir npm pkg get version \;

# 或使用 pnpm
pnpm why esbuild
```

## 常见 esbuild 版本冲突场景

### 场景 1：vite 和 @swc/core 版本冲突

- vite 4.x 依赖 esbuild 0.18.x
- @swc/core 某些版本依赖 esbuild 0.21.x
- 解决：使用 `pnpm.overrides` 强制统一版本

### 场景 2：Taro 和依赖版本冲突

- Taro 4.1.9 依赖 esbuild 0.18.20
- 某些插件依赖 esbuild 0.21.x
- 解决：使用 `pnpm.overrides` 强制统一版本

### 场景 3：升级 vite 导致版本冲突

- 升级 vite 到 5.x 后，依赖 esbuild 0.19.x
- 但其他依赖仍然依赖 esbuild 0.18.x
- 解决：使用 `pnpm.overrides` 强制统一版本

## 其他解决方案（备选）

### 方案 1：升级 vite 到最新版本

```bash
pnpm add -D vite@latest
```

**优点**：
- 使用最新版本的 vite 和 esbuild
- 获得更好的性能和功能

**缺点**：
- 可能需要修改其他配置
- 可能引入新的兼容性问题

### 方案 2：降级 @swc/core

```bash
pnpm remove @swc/core
pnpm add -D @swc/core@1.3.100
```

**优点**：
- 保持 vite 和 esbuild 版本不变

**缺点**：
- 可能影响其他功能

### 方案 3：使用 npm overrides

如果使用 npm 而不是 pnpm：

```json
{
  "overrides": {
    "esbuild": "0.18.20"
  }
}
```

### 方案 4：使用 yarn resolutions

如果使用 yarn：

```json
{
  "resolutions": {
    "esbuild": "0.18.20"
  }
}
```

## 注意事项

1. **pnpm 版本**：确保使用 pnpm 8.x 或更高版本（pnpm.overrides 需要 pnpm 8.0+）
2. **版本兼容性**：确保选择的 esbuild 版本与所有主要依赖兼容
3. **重新安装**：修改 package.json 后，建议删除 node_modules 和 pnpm-lock.yaml，重新安装依赖
4. **测试**：修改后务必完整构建项目，确保所有功能正常

## 参考资料

- [pnpm overrides 文档](https://pnpm.io/package_json#pnpmoverrides)
- [esbuild 官方文档](https://esbuild.github.io/)
- [vite 官方文档](https://vitejs.dev/)
- [pnpm 为什么比 npm 快](https://pnpm.io/motivation)
- [Node.js 模块版本冲突解决方案](https://nodejs.org/en/docs/es6/node-addon-api/)
