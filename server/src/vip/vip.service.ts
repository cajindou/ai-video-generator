import { Injectable, OnModuleInit } from '@nestjs/common'
import { db, users, vipPlans, vipOrders } from '@/database'
import { eq, and, desc } from 'drizzle-orm'

@Injectable()
export class VIPService implements OnModuleInit {
  /**
   * 模块初始化时运行
   */
  async onModuleInit() {
    await this.initializeVIPPlans()
  }

  /**
   * 初始化会员套餐数据
   */
  private async initializeVIPPlans(): Promise<void> {
    try {
      // 检查是否已有套餐数据
      const existingPlans = await db.select().from(vipPlans).limit(1)

      if (existingPlans.length === 0) {
        console.log('[VIPService] 初始化会员套餐数据...')

        // 插入默认套餐
        const defaultPlans = [
          {
            id: 'plan_basic',
            name: '基础版',
            price: 299,
            quota: 10,
            description: '每天10次，当天有效，第二天重置，适合轻度用户',
            duration: 30,
            isActive: true,
            createdAt: new Date(),
          },
          {
            id: 'plan_pro',
            name: '进阶版',
            price: 399,
            quota: 20,
            description: '每天20次，当天有效，第二天重置，适合专业用户',
            duration: 30,
            isActive: true,
            createdAt: new Date(),
          },
          {
            id: 'plan_premium',
            name: '尊享版',
            price: 599,
            quota: -1,
            description: '30天不限次视频生成，适合重度用户',
            duration: 30,
            isActive: true,
            createdAt: new Date(),
          },
        ]

        await db.insert(vipPlans).values(defaultPlans)
        console.log('[VIPService] 会员套餐数据初始化完成')
      }
    } catch (error) {
      console.error('[VIPService] 初始化会员套餐数据失败:', error)
    }
  }
  /**
   * ========================
   * 用户操作
   * ========================
   */

  /**
   * 根据 openid 查找或创建用户
   */
  async findOrCreateUser(openid: string): Promise<any> {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openid, openid))
      .limit(1)

    if (existingUser.length > 0) {
      return existingUser[0]
    }

    // 创建新用户
    const newUser = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      openid,
      nickname: null,
      avatarUrl: null,
      isVip: false,
      vipPlanId: null,
      vipExpireAt: null,
      dailyQuota: 3, // 免费用户每天3次
      usedQuotaToday: 0,
      lastQuotaResetDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(users).values(newUser)
    return newUser
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, data: Partial<any>): Promise<void> {
    await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
  }

  /**
   * 检查并重置每日配额
   */
  async checkAndResetDailyQuota(userId: string): Promise<void> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (user.length === 0) {
      return
    }

    const userData = user[0]
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    // 如果会员已过期，重置为免费用户
    if (userData.isVip && userData.vipExpireAt && userData.vipExpireAt < now) {
      await this.updateUser(userId, {
        isVip: false,
        vipPlanId: null,
        vipExpireAt: null,
        dailyQuota: 3,
      })
    }

    // 如果是新的一天，重置已使用次数
    if (userData.lastQuotaResetDate) {
      const lastResetDate = new Date(userData.lastQuotaResetDate)
      const lastResetDay = new Date(lastResetDate.getFullYear(), lastResetDate.getMonth(), lastResetDate.getDate())

      if (today > lastResetDay) {
        await this.updateUser(userId, {
          usedQuotaToday: 0,
          lastQuotaResetDate: today,
        })
      }
    }
  }

  /**
   * 获取用户剩余配额
   */
  async getUserQuota(openid: string): Promise<{
    isVip: boolean
    totalQuota: number
    usedQuotaToday: number
    remainingQuota: number
    vipExpireAt: Date | null
  }> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.openid, openid))
      .limit(1)

    if (user.length === 0) {
      return {
        isVip: false,
        totalQuota: 3,
        usedQuotaToday: 0,
        remainingQuota: 3,
        vipExpireAt: null,
      }
    }

    const userData = user[0]
    await this.checkAndResetDailyQuota(userData.id)

    // 重新获取用户数据
    const refreshedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1)

    const finalUser = refreshedUser[0]
    const totalQuota = finalUser.dailyQuota || 3
    const usedQuotaToday = finalUser.usedQuotaToday || 0
    const remainingQuota = Math.max(0, totalQuota - usedQuotaToday)

    return {
      isVip: finalUser.isVip || false,
      totalQuota,
      usedQuotaToday,
      remainingQuota,
      vipExpireAt: finalUser.vipExpireAt || null,
    }
  }

  /**
   * 检查用户是否有足够的配额
   */
  async checkUserQuota(openid: string): Promise<boolean> {
    const quota = await this.getUserQuota(openid)
    return quota.remainingQuota > 0
  }

  /**
   * 消耗用户配额
   */
  async consumeQuota(openid: string): Promise<boolean> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.openid, openid))
      .limit(1)

    if (user.length === 0) {
      return false
    }

    const userData = user[0]
    await this.checkAndResetDailyQuota(userData.id)

    const refreshedUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1)

    const finalUser = refreshedUser[0]
    const remainingQuota = (finalUser.dailyQuota || 3) - (finalUser.usedQuotaToday || 0)

    if (remainingQuota <= 0) {
      return false
    }

    await this.updateUser(userData.id, {
      usedQuotaToday: (finalUser.usedQuotaToday || 0) + 1,
    })

    return true
  }

  /**
   * ========================
   * 会员套餐操作
   * ========================
   */

  /**
   * 获取所有激活的会员套餐
   */
  async getAllActivePlans(): Promise<any[]> {
    return await db
      .select()
      .from(vipPlans)
      .where(eq(vipPlans.isActive, true))
  }

  /**
   * 根据 ID 获取套餐详情
   */
  async getPlanById(planId: string): Promise<any> {
    const plan = await db
      .select()
      .from(vipPlans)
      .where(eq(vipPlans.id, planId))
      .limit(1)

    return plan.length > 0 ? plan[0] : null
  }

  /**
   * ========================
   * 会员管理（管理员接口）
   * ========================
   */

  /**
   * 手动开通会员（管理员接口）
   */
  async activateVIP(openid: string, planId: string): Promise<any> {
    // 查找或创建用户
    const user = await this.findOrCreateUser(openid)

    // 获取套餐信息
    const plan = await this.getPlanById(planId)
    if (!plan) {
      throw new Error('套餐不存在')
    }

    // 计算会员到期时间
    const now = new Date()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + (plan.duration || 30))

    // 更新用户会员状态
    await this.updateUser(user.id, {
      isVip: true,
      vipPlanId: planId,
      vipExpireAt: expireAt,
      dailyQuota: plan.quota,
    })

    // 创建会员订单记录
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    await db.insert(vipOrders).values({
      id: orderId,
      userId: user.id,
      openid,
      planId,
      planName: plan.name,
      amount: plan.price,
      status: 'paid',
      paymentMethod: 'admin_manual',
      paidAt: now,
      createdAt: now,
    })

    return {
      success: true,
      userId: user.id,
      openid,
      planName: plan.name,
      expireAt,
    }
  }

  /**
   * 根据openid查询用户信息（用于客服查询）
   */
  async getUserByOpenid(openid: string): Promise<any> {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.openid, openid))
      .limit(1)

    if (user.length === 0) {
      return null
    }

    const userData = user[0]

    // 获取套餐名称
    let planName = null
    if (userData.vipPlanId) {
      const plan = await this.getPlanById(userData.vipPlanId)
      if (plan) {
        planName = plan.name
      }
    }

    return {
      ...userData,
      planName,
    }
  }

  /**
   * 获取用户的会员订单列表
   */
  async getUserOrders(openid: string): Promise<any[]> {
    return await db
      .select()
      .from(vipOrders)
      .where(eq(vipOrders.openid, openid))
      .orderBy(desc(vipOrders.createdAt))
    }

  /**
   * 获取所有会员订单（管理员接口）
   */
  async getAllOrders(page: number = 1, pageSize: number = 20): Promise<{
    list: any[]
    total: number
  }> {
    const allOrders = await db
      .select()
      .from(vipOrders)
      .orderBy(desc(vipOrders.createdAt))

    const total = allOrders.length
    const start = (page - 1) * pageSize
    const list = allOrders.slice(start, start + pageSize)

    return { list, total }
  }
}
