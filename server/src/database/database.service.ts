import { Injectable } from '@nestjs/common'
import { db, videoHistory, videoFavorites, users, NewVideoHistory, NewVideoFavorites, VideoHistory, VideoFavorites } from '@/database'
import { eq, desc } from 'drizzle-orm'

@Injectable()
export class DatabaseService {
  /**
   * ========================
   * 视频历史记录操作
   * ========================
   */

  /**
   * 添加历史记录
   */
  async addVideoHistory(item: Omit<NewVideoHistory, 'id' | 'createdAt'>): Promise<void> {
    const newItem: NewVideoHistory = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    await db.insert(videoHistory).values(newItem)

    // 限制历史记录数量为 50 条
    const allHistory = await db
      .select()
      .from(videoHistory)
      .orderBy(desc(videoHistory.createdAt))

    if (allHistory.length > 50) {
      // 删除超出限制的记录
      const toDelete = allHistory.slice(50)
      for (const record of toDelete) {
        await db.delete(videoHistory).where(eq(videoHistory.id, record.id))
      }
    }
  }

  /**
   * 获取所有历史记录
   */
  async getAllVideoHistory(): Promise<VideoHistory[]> {
    return await db
      .select()
      .from(videoHistory)
      .orderBy(desc(videoHistory.createdAt))
  }

  /**
   * 获取分页历史记录
   */
  async getPaginatedVideoHistory(page: number = 1, pageSize: number = 10): Promise<{
    list: VideoHistory[]
    total: number
    page: number
    pageSize: number
  }> {
    const allHistory = await this.getAllVideoHistory()
    const total = allHistory.length
    const start = (page - 1) * pageSize
    const list = allHistory.slice(start, start + pageSize)

    return { list, total, page, pageSize }
  }

  /**
   * 删除历史记录
   */
  async removeVideoHistory(id: string): Promise<void> {
    await db.delete(videoHistory).where(eq(videoHistory.id, id))
  }

  /**
   * 清空所有历史记录
   */
  async clearVideoHistory(): Promise<void> {
    await db.delete(videoHistory)
  }

  /**
   * 获取历史记录统计信息
   */
  async getVideoHistoryStats(): Promise<{
    total: number
    todayCount: number
    weekCount: number
  }> {
    const allHistory = await this.getAllVideoHistory()
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(now)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const todayCount = allHistory.filter((item) => item.createdAt >= todayStart).length
    const weekCount = allHistory.filter((item) => item.createdAt >= weekStart).length

    return {
      total: allHistory.length,
      todayCount,
      weekCount,
    }
  }

  /**
   * ========================
   * 视频收藏操作
   * ========================
   */

  /**
   * 添加收藏
   */
  async addVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<void> {
    // 检查是否已存在
    const existing = await db
      .select()
      .from(videoFavorites)
      .where(eq(videoFavorites.videoUrl, item.videoUrl))
      .limit(1)

    if (existing.length > 0) {
      return
    }

    const newItem: NewVideoFavorites = {
      ...item,
      id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    await db.insert(videoFavorites).values(newItem)
  }

  /**
   * 获取所有收藏
   */
  async getAllVideoFavorites(): Promise<VideoFavorites[]> {
    return await db
      .select()
      .from(videoFavorites)
      .orderBy(desc(videoFavorites.createdAt))
  }

  /**
   * 检查是否已收藏
   */
  async isVideoFavorite(videoUrl: string): Promise<boolean> {
    const existing = await db
      .select()
      .from(videoFavorites)
      .where(eq(videoFavorites.videoUrl, videoUrl))
      .limit(1)

    return existing.length > 0
  }

  /**
   * 删除收藏
   */
  async removeVideoFavorite(videoUrl: string): Promise<void> {
    await db.delete(videoFavorites).where(eq(videoFavorites.videoUrl, videoUrl))
  }

  /**
   * 清空所有收藏
   */
  async clearVideoFavorites(): Promise<void> {
    await db.delete(videoFavorites)
  }

  /**
   * 切换收藏状态
   */
  async toggleVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<boolean> {
    const isFav = await this.isVideoFavorite(item.videoUrl)
    if (isFav) {
      await this.removeVideoFavorite(item.videoUrl)
      return false
    } else {
      await this.addVideoFavorite(item)
      return true
    }
  }

  /**
   * ========================
   * 数据库初始化
   * ========================
   */

  /**
   * 初始化数据库（创建表）
   */
  async initializeDatabase(): Promise<void> {
    try {
      // 验证表是否可以正常访问
      await this.getAllVideoHistory()
      await this.getAllVideoFavorites()
      console.log('[DatabaseService] 数据库初始化成功')
    } catch (error) {
      console.error('[DatabaseService] 数据库初始化失败:', error)
      throw error
    }
  }

  /**
   * ========================
   * 用户操作
   * ========================
   */

  /**
   * 根据 openid 获取用户历史记录
   */
  async getUserVideoHistory(openid: string, page: number = 1, pageSize: number = 10): Promise<{
    list: VideoHistory[]
    total: number
    page: number
    pageSize: number
  }> {
    const allHistory = await this.getAllVideoHistory()
    const userHistory = allHistory.filter(item => item.openid === openid)
    const total = userHistory.length
    const start = (page - 1) * pageSize
    const list = userHistory.slice(start, start + pageSize)

    return { list, total, page, pageSize }
  }

  /**
   * 根据 openid 获取用户收藏
   */
  async getUserVideoFavorites(openid: string, page: number = 1, pageSize: number = 10): Promise<{
    list: VideoFavorites[]
    total: number
    page: number
    pageSize: number
  }> {
    const allFavorites = await this.getAllVideoFavorites()
    const userFavorites = allFavorites.filter(item => item.openid === openid)
    const total = userFavorites.length
    const start = (page - 1) * pageSize
    const list = userFavorites.slice(start, start + pageSize)

    return { list, total, page, pageSize }
  }

  /**
   * 添加用户历史记录
   */
  async addUserVideoHistory(item: Omit<NewVideoHistory, 'id' | 'createdAt'> & { openid: string }): Promise<void> {
    await this.addVideoHistory(item)
  }

  /**
   * 添加用户收藏
   */
  async addUserVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'> & { openid: string }): Promise<boolean> {
    // 检查是否已存在
    const existing = await db
      .select()
      .from(videoFavorites)
      .where(eq(videoFavorites.videoUrl, item.videoUrl))
      .limit(1)

    if (existing.length > 0) {
      // 如果已存在，删除
      await this.removeVideoFavorite(item.videoUrl)
      return false
    }

    const newItem: NewVideoFavorites = {
      ...item,
      id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }

    await db.insert(videoFavorites).values(newItem)
    return true
  }
}
