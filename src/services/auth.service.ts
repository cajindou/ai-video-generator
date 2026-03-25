import Taro from '@tarojs/taro'
import { UserService } from './user.service'

export interface UserInfo {
  openid: string
  nickname?: string
  avatarUrl?: string
  isVip: boolean
  quota: {
    isVip: boolean
    totalQuota: number
    usedQuotaToday: number
    remainingQuota: number
    vipExpireAt: Date | null
  }
}

/**
 * 认证管理服务
 */
export class AuthService {
  private static readonly STORAGE_KEY_OPENID = 'user_openid'
  private static readonly STORAGE_KEY_USERINFO = 'user_info'
  private static loginPromise: Promise<UserInfo | null> | null = null

  /**
   * 登录（自动识别微信用户）
   * 使用单例模式防止重复登录
   */
  static async login(): Promise<UserInfo | null> {
    // 如果正在登录中，返回同一个 Promise
    if (this.loginPromise) {
      return this.loginPromise
    }

    this.loginPromise = this.doLogin()
    try {
      return await this.loginPromise
    } finally {
      this.loginPromise = null
    }
  }

  private static async doLogin(): Promise<UserInfo | null> {
    try {
      // 优先从缓存获取用户信息
      const cachedUserInfo = this.getUserInfo()
      if (cachedUserInfo && cachedUserInfo.openid) {
        console.log('[AuthService] 使用缓存的用户信息')
        return cachedUserInfo
      }

      // 检查是否已有 openid
      const cachedOpenid = Taro.getStorageSync(this.STORAGE_KEY_OPENID)
      if (cachedOpenid) {
        // 获取最新用户信息（带超时处理）
        try {
          const userInfo = await UserService.getUserInfo(cachedOpenid)
          const userInfoData = (userInfo as any).data
          if (userInfoData && userInfoData.code === 200) {
            // 更新缓存
            Taro.setStorageSync(this.STORAGE_KEY_USERINFO, userInfoData.data)
            return userInfoData.data
          }
        } catch (err) {
          console.warn('[AuthService] 获取用户信息超时，使用缓存')
          // 超时时返回缓存的用户信息
          if (cachedUserInfo) {
            return cachedUserInfo
          }
        }
      }

      // 调用微信登录
      const loginRes = await Taro.login()

      if (!loginRes.code) {
        console.error('[AuthService] 微信登录失败：未获取到 code')
        return null
      }

      // 调用后端登录接口
      const loginResult = await UserService.weappLogin(loginRes.code)
      const responseData = (loginResult as any).data

      console.log('[AuthService] 登录响应:', responseData)

      if (responseData && responseData.code === 200) {
        const { openid, quota } = responseData.data

        // 保存 openid
        Taro.setStorageSync(this.STORAGE_KEY_OPENID, openid)

        // 保存用户信息
        const userInfo: UserInfo = {
          openid,
          quota,
          isVip: quota.isVip,
        }
        Taro.setStorageSync(this.STORAGE_KEY_USERINFO, userInfo)

        return userInfo
      }

      return null
    } catch (error) {
      console.error('[AuthService] 登录失败:', error)
      return null
    }
  }

  /**
   * 获取当前用户信息
   */
  static getUserInfo(): UserInfo | null {
    try {
      const userInfo = Taro.getStorageSync(this.STORAGE_KEY_USERINFO)
      return userInfo || null
    } catch (error) {
      console.error('[AuthService] 获取用户信息失败:', error)
      return null
    }
  }

  /**
   * 获取当前用户 openid
   */
  static getOpenid(): string | null {
    try {
      const openid = Taro.getStorageSync(this.STORAGE_KEY_OPENID)
      return openid || null
    } catch (error) {
      console.error('[AuthService] 获取 openid 失败:', error)
      return null
    }
  }

  /**
   * 更新用户信息
   */
  static updateUserInfo(userInfo: Partial<UserInfo>): void {
    try {
      const currentInfo = this.getUserInfo()
      if (currentInfo) {
        const newInfo = { ...currentInfo, ...userInfo }
        Taro.setStorageSync(this.STORAGE_KEY_USERINFO, newInfo)
      }
    } catch (error) {
      console.error('[AuthService] 更新用户信息失败:', error)
    }
  }

  /**
   * 检查是否已登录
   */
  static isLoggedIn(): boolean {
    const openid = this.getOpenid()
    return !!openid
  }

  /**
   * 退出登录
   */
  static logout(): void {
    try {
      Taro.removeStorageSync(this.STORAGE_KEY_OPENID)
      Taro.removeStorageSync(this.STORAGE_KEY_USERINFO)
    } catch (error) {
      console.error('[AuthService] 退出登录失败:', error)
    }
  }

  /**
   * 刷新用户信息
   */
  static async refreshUserInfo(): Promise<UserInfo | null> {
    const openid = this.getOpenid()
    if (!openid) {
      return null
    }

    const userInfo = await UserService.getUserInfo(openid)
    const userInfoData = (userInfo as any).data
    if (userInfoData && userInfoData.code === 200) {
      this.updateUserInfo(userInfoData.data)
      return userInfoData.data
    }

    return null
  }
}
