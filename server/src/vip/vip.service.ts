import { Injectable, OnModuleInit } from '@nestjs/common'
import { useMemoryStorage, memoryUsers, memoryPlans, memoryOrders } from '@/database'
import { getTodayFeature, getTomorrowFeature, getWeekFeatures, getDayIndex } from './feature-rotation.config'

@Injectable()
export class VIPService implements OnModuleInit {
  async onModuleInit() {
    console.log('[VIPService] 使用内存存储模式')
  }

  getTodayFreeFeature() {
    const todayFeature = getTodayFeature();
    const tomorrowFeature = getTomorrowFeature();
    const weekFeatures = getWeekFeatures();
    const dayIndex = getDayIndex();

    return {
      today: todayFeature,
      tomorrow: tomorrowFeature,
      weekFeatures: weekFeatures,
      dayIndex: dayIndex,
      message: `今日体验：${todayFeature.name}`,
    };
  }

  async findOrCreateUser(openid: string): Promise<any> {
    let user = memoryUsers.get(openid)
    if (!user) {
      user = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        openid,
        nickname: null,
        avatar_url: null,
        is_vip: false,
        vip_plan_id: null,
        vip_expire_at: null,
        daily_quota: 3,
        used_quota_today: 0,
        last_quota_reset_date: Date.now(),
        created_at: Date.now(),
        updated_at: Date.now(),
      }
      memoryUsers.set(openid, user)
    }
    return user
  }

  async updateUser(id: string, data: Partial<any>): Promise<void> {
    for (const [openid, user] of memoryUsers.entries()) {
      if (user.id === id) {
        memoryUsers.set(openid, { ...user, ...data, updated_at: Date.now() })
        return
      }
    }
  }

  async getUserQuota(openid: string): Promise<{
    isVip: boolean
    totalQuota: number
    usedQuotaToday: number
    remainingQuota: number
    vipExpireAt: Date | null
  }> {
    const user = await this.findOrCreateUser(openid)
    
    const totalQuota = user.daily_quota || 3
    const usedQuotaToday = user.used_quota_today || 0
    const remainingQuota = Math.max(0, totalQuota - usedQuotaToday)

    return {
      isVip: !!user.is_vip,
      totalQuota,
      usedQuotaToday,
      remainingQuota,
      vipExpireAt: user.vip_expire_at ? new Date(user.vip_expire_at) : null,
    }
  }

  async checkUserQuota(openid: string): Promise<boolean> {
    const quota = await this.getUserQuota(openid)
    return quota.remainingQuota > 0
  }

  async consumeQuota(openid: string): Promise<boolean> {
    const user = await this.findOrCreateUser(openid)
    const remainingQuota = (user.daily_quota || 3) - (user.used_quota_today || 0)
    
    if (remainingQuota <= 0) return false
    
    await this.updateUser(user.id, { used_quota_today: (user.used_quota_today || 0) + 1 })
    return true
  }

  async getAllActivePlans(): Promise<any[]> {
    return Array.from(memoryPlans.values())
  }

  async getPlanById(planId: string): Promise<any> {
    return memoryPlans.get(planId)
  }

  async activateVIP(openid: string, planId: string): Promise<any> {
    const user = await this.findOrCreateUser(openid)
    const plan = await this.getPlanById(planId)
    
    if (!plan) throw new Error('套餐不存在')

    const now = new Date()
    const expireAt = new Date()
    expireAt.setDate(expireAt.getDate() + (plan.duration || 30))

    const updatedUser = {
      ...user,
      is_vip: true,
      vip_plan_id: planId,
      vip_expire_at: expireAt.getTime(),
      daily_quota: plan.quota === -1 ? 999999 : plan.quota,
      updated_at: Date.now(),
    }
    memoryUsers.set(openid, updatedUser)

    return {
      success: true,
      userId: user.id,
      openid,
      planName: plan.name,
      expireAt,
    }
  }

  async getUserByOpenid(openid: string): Promise<any> {
    const user = await this.findOrCreateUser(openid)
    const plan = user.vip_plan_id ? await this.getPlanById(user.vip_plan_id) : null
    return { ...user, planName: plan?.name }
  }

  async getUserOrders(openid: string): Promise<any[]> {
    return Array.from(memoryOrders.values()).filter(o => o.openid === openid)
  }

  async getAllOrders(page: number = 1, pageSize: number = 20): Promise<{ list: any[], total: number }> {
    const allOrders = Array.from(memoryOrders.values())
    const total = allOrders.length
    const start = (page - 1) * pageSize
    return { list: allOrders.slice(start, start + pageSize), total }
  }
}
