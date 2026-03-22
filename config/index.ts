import path from 'node:path';
import dotenv from 'dotenv';

import tailwindcss from '@tailwindcss/postcss';
import { UnifiedViteWeappTailwindcssPlugin } from 'weapp-tailwindcss/vite';
import { defineConfig, type UserConfigExport } from '@tarojs/cli';
import type { PluginItem } from '@tarojs/taro/types/compile/config/project';

// 加载环境变量
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import devConfig from './dev';
import prodConfig from './prod';
import pkg from '../package.json';

// https://taro-docs.jd.com/docs/next/config#defineconfig-辅助函数
export default defineConfig<'vite'>(async (merge, _env) => {
  const isWeChatApp = process.env.TARO_ENV === 'weapp';
  const outputRoot = process.env.OUTPUT_ROOT || (isWeChatApp ? 'dist-weapp' : 'dist-web')

  const baseConfig: UserConfigExport<'vite'> = {
    projectName: 'coze-mini-program',
    date: '2026-1-13',
    alias: {
      '@': path.resolve(__dirname, '..', 'src'),
    },
    designWidth: 750,
    deviceRatio: {
      640: 2.34 / 2,
      750: 1,
      375: 2,
      828: 1.81 / 2,
    },
    sourceRoot: 'src',
    outputRoot,
    plugins: [
      '@tarojs/plugin-generator',
      ...(process.env.TARO_APP_WEAPP_APPID
        ? ([
            [
              '@tarojs/plugin-mini-ci',
              {
                version: pkg.version,
                desc: pkg.description,
                weapp: {
                  appid: process.env.TARO_APP_WEAPP_APPID,
                  privateKeyPath: 'key/private.appid.key',
                },
              },
            ],
          ] as PluginItem[])
        : []),
    ],
    defineConstants: {
      PROJECT_DOMAIN: JSON.stringify(
        process.env.PROJECT_DOMAIN ||
          process.env.COZE_PROJECT_DOMAIN_DEFAULT ||
          'https://yuxuanbaihuo.site', // 生产环境默认域名
      ),
      TARO_ENV: JSON.stringify(process.env.TARO_ENV),
    },
    copy: {
      patterns: [],
      options: {},
    },
    framework: 'react',
    compiler: {
      type: 'vite',
      vitePlugins: [
        {
          name: 'postcss-config-loader-plugin',
          config(config) {
            // 通过 postcss 配置注册 tailwindcss 插件
            if (typeof config.css?.postcss === 'object') {
              config.css?.postcss.plugins?.unshift(tailwindcss());
            }
          },
        },
        {
          name: 'hmr-config-plugin',
          config() {
            if (!process.env.PROJECT_DOMAIN) {
              return;
            }
            return {
              server: {
                hmr: {
                  overlay: true,
                  path: '/hot/vite-hmr',
                  port: 6000,
                  clientPort: 443,
                  timeout: 30000,
                },
              },
            };
          },
        },
        UnifiedViteWeappTailwindcssPlugin({
          rem2rpx: true,
          cssEntries: [
            // 你 @import "tailwindcss"; 那个文件的绝对路径
            path.resolve(__dirname, '../src/app.css'),
          ],
        }),
      ],
    },
    mini: {
      postcss: {
        pxtransform: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    h5: {
      publicPath: '/',
      staticDirectory: 'static',
      devServer: {
          port: 5000,
          host: '0.0.0.0',
          open: false,
          proxy: {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true,
            },
          },
      },
      miniCssExtractPluginOption: {
        ignoreOrder: true,
        filename: 'css/[name].[hash].css',
        chunkFilename: 'css/[name].[chunkhash].css',
      },
      postcss: {
        autoprefixer: {
          enable: true,
          config: {},
        },
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
          config: {
            namingPattern: 'module', // 转换模式，取值为 global/module
            generateScopedName: '[name]__[local]___[hash:base64:5]',
          },
        },
      },
    },
    rn: {
      appName: 'coze-mini-program',
      postcss: {
        cssModules: {
          enable: false, // 默认为 false，如需使用 css modules 功能，则设为 true
        },
      },
    },
  };

  process.env.BROWSERSLIST_ENV = process.env.NODE_ENV;

  if (process.env.NODE_ENV === 'development') {
    // 本地开发构建配置（不混淆压缩）
    return merge({}, baseConfig, devConfig);
  }
  // 生产构建配置（默认开启压缩混淆等）
  return merge({}, baseConfig, prodConfig);
});
