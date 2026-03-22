import { Network } from '@/network'

/**
 * 用户相关接口
 */
export class UserService {
  /**
   * 微信小程序登录
   */
  static async weappLogin(code: string, userInfo?: {
    nickName?: string
    avatarUrl?: string
  }) {
    return Network.request({
      url: '/api/auth/weapp/login',
      method: 'POST',
      data: {
        code,
        userInfo,
      },
    })
  }

  /**
   * 获取用户信息
   */
  static async getUserInfo(openid: string) {
    return Network.request({
      url: '/api/auth/user',
      method: 'GET',
      data: { openid },
    })
  }

  /**
   * 获取用户配额
   */
  static async getUserQuota(openid: string) {
    return Network.request({
      url: '/api/vip/quota',
      method: 'GET',
      data: { openid },
    })
  }

  /**
   * 检查用户配额
   */
  static async checkUserQuota(openid: string) {
    return Network.request({
      url: '/api/vip/check-quota',
      method: 'GET',
      data: { openid },
    })
  }

  /**
   * 获取会员套餐列表
   */
  static async getVipPlans() {
    return Network.request({
      url: '/api/vip/plans',
      method: 'GET',
    })
  }

  /**
   * 获取用户订单
   */
  static async getUserOrders(openid: string) {
    return Network.request({
      url: '/api/vip/orders',
      method: 'GET',
      data: { openid },
    })
  }

  /**
   * 获取用户历史记录
   */
  static async getUserHistory(openid: string, page: number = 1, pageSize: number = 10) {
    return Network.request({
      url: '/api/database/history/user',
      method: 'GET',
      data: { openid, page, pageSize },
    })
  }

  /**
   * 获取用户收藏
   */
  static async getUserFavorites(openid: string, page: number = 1, pageSize: number = 10) {
    return Network.request({
      url: '/api/database/favorites/user',
      method: 'GET',
      data: { openid, page, pageSize },
    })
  }

  /**
   * 添加用户历史记录
   */
  static async addUserHistory(data: {
    openid: string
    images: string[]
    videoUrl: string
    copywriting?: string
    thumbnail?: string
    storeName?: string
    imageUrls: string[]
  }) {
    return Network.request({
      url: '/api/database/history/user',
      method: 'POST',
      data,
    })
  }

  /**
   * 添加用户收藏
   */
  static async addUserFavorite(data: {
    openid: string
    videoUrl: string
    thumbnail?: string
    title?: string
    author?: string
    avatar?: string
    storeName?: string
    coverImage?: string
    category?: string
  }) {
    return Network.request({
      url: '/api/database/favorites/user',
      method: 'POST',
      data,
    })
  }
}
