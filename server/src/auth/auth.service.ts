import { Injectable } from '@nestjs/common'
import axios from 'axios'
import { VIPService } from '@/vip/vip.service'

@Injectable()
export class AuthService {
  constructor(private readonly vipService: VIPService) {}

  /**
   * 微信小程序登录/注册
   * @param code 微信登录 code
   * @param userInfo 用户信息（昵称、头像等）
   */
  async weappLogin(code: string, userInfo?: {
    nickName?: string
    avatarUrl?: string
  }): Promise<{
    openid: string
    isNewUser: boolean
    quota: any
  }> {
    console.log('[AuthService] 微信小程序登录:', { code, userInfo })

    // 调用微信 code2session 接口
    const appId = process.env.WECHAT_APP_ID
    const appSecret = process.env.WECHAT_APP_SECRET

    if (!appId || !appSecret) {
      console.error('[AuthService] 微信 AppID 或 AppSecret 未配置')
      throw new Error('微信配置未完成')
    }

    try {
      const response = await axios.get(
        `https://api.weixin.qq.com/sns/jscode2session?appid=${appId}&secret=${appSecret}&js_code=${code}&grant_type=authorization_code`
      )

      const data = response.data

      if (data.errcode) {
        console.error('[AuthService] 微信登录失败:', data)
        throw new Error(`微信登录失败: ${data.errmsg}`)
      }

      const openid = data.openid
      console.log('[AuthService] 获取 openid 成功:', openid)

      // 查找或创建用户
      const user = await this.vipService.findOrCreateUser(openid)

      // 如果提供了用户信息，更新用户资料
      if (userInfo && (userInfo.nickName || userInfo.avatarUrl)) {
        await this.vipService.updateUser(user.id, {
          nickname: userInfo.nickName || user.nickname,
          avatarUrl: userInfo.avatarUrl || user.avatarUrl,
        })
      }

      // 获取用户配额信息
      const quota = await this.vipService.getUserQuota(openid)

      return {
        openid,
        isNewUser: !user.createdAt || (Date.now() - new Date(user.createdAt).getTime()) < 5000,
        quota,
      }
    } catch (error) {
      console.error('[AuthService] 微信登录异常:', error)
      throw error
    }
  }

  /**
   * 根据 openid 获取用户信息
   */
  async getUserInfo(openid: string): Promise<any> {
    const user = await this.vipService.getUserByOpenid(openid)
    const quota = await this.vipService.getUserQuota(openid)

    if (!user) {
      return null
    }

    return {
      ...user,
      quota,
    }
  }
}
