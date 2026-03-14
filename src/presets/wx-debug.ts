import Taro from '@tarojs/taro'

/**
 * 微信小程序调试工具
 * 在开发版/体验版自动开启调试模式
 */
export function enableWxDebugIfNeeded() {
  // 仅在微信小程序环境执行
  if (Taro.getEnv() === Taro.ENV_TYPE.WEAPP) {
    try {
      const accountInfo = Taro.getAccountInfoSync()
      const envVersion = accountInfo.miniProgram.envVersion
      console.log('[Debug] envVersion:', envVersion)

      // 开发版/体验版自动开启调试
      if (envVersion !== 'release') {
        Taro.setEnableDebug({ enableDebug: true })
      }
    } catch (error) {
      console.error('[Debug] 开启调试模式失败:', error)
    }
  }
}
