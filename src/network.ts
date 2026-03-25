import Taro from '@tarojs/taro'

// 生产环境域名 - 小程序专用
const PRODUCTION_DOMAIN = 'https://yuxuanbaihuo.site'

// 默认超时时间（毫秒）
const DEFAULT_TIMEOUT = 30000

/**
 * 网络请求模块
 * 封装 Taro.request、Taro.uploadFile、Taro.downloadFile，自动添加项目域名前缀
 * 如果请求的 url 以 http:// 或 https:// 开头，则不会添加域名前缀
 *
 * IMPORTANT: 项目已经全局注入 PROJECT_DOMAIN
 * IMPORTANT: 除非你需要添加全局参数，如给所有请求加上 header，否则不能修改此文件
 */
export namespace Network {
    const createUrl = (url: string): string => {
        if (url.startsWith('http://') || url.startsWith('https://')) {
            return url
        }
        // 优先使用生产域名，确保小程序连接到正确的服务器
        const domain = PRODUCTION_DOMAIN || (typeof PROJECT_DOMAIN !== 'undefined' ? PROJECT_DOMAIN : '')
        return `${domain}${url}`
    }

    export const request: typeof Taro.request = option => {
        return Taro.request({
            ...option,
            url: createUrl(option.url),
            timeout: option.timeout || DEFAULT_TIMEOUT,
        })
    }

    export const uploadFile: typeof Taro.uploadFile = option => {
        return Taro.uploadFile({
            ...option,
            url: createUrl(option.url),
            timeout: option.timeout || DEFAULT_TIMEOUT,
        })
    }

    export const downloadFile: typeof Taro.downloadFile = option => {
        return Taro.downloadFile({
            ...option,
            url: createUrl(option.url),
            timeout: option.timeout || DEFAULT_TIMEOUT,
        })
    }
}
