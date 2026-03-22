import { Injectable } from '@nestjs/common'
import { useMemoryStorage, memoryUsers, memoryPlans, memoryOrders } from '@/database'
import type { VideoHistory, VideoFavorites, NewVideoHistory, NewVideoFavorites } from './schema'

// 内存存储
const memoryHistory: any[] = []
const memoryFavorites: any[] = []

@Injectable()
export class DatabaseService {
  /**
   * 视频历史记录操作
   */

  async addVideoHistory(item: Omit<NewVideoHistory, 'id' | 'createdAt'>): Promise<void> {
    const newItem = {
      ...item,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    memoryHistory.unshift(newItem)
    if (memoryHistory.length > 50) memoryHistory.pop()
  }

  async getAllVideoHistory(): Promise<any[]> {
    return memoryHistory
  }

  async getPaginatedVideoHistory(page: number = 1, pageSize: number = 10): Promise<{ list: any[], total: number, page: number, pageSize: number }> {
    const start = (page - 1) * pageSize
    return { list: memoryHistory.slice(start, start + pageSize), total: memoryHistory.length, page, pageSize }
  }

  async removeVideoHistory(id: string): Promise<void> {
    const idx = memoryHistory.findIndex(h => h.id === id)
    if (idx > -1) memoryHistory.splice(idx, 1)
  }

  async clearVideoHistory(): Promise<void> {
    memoryHistory.length = 0
  }

  async getVideoHistoryStats(): Promise<{ total: number, todayCount: number, weekCount: number }> {
    const now = Date.now()
    const todayStart = new Date().setHours(0, 0, 0, 0)
    const weekStart = now - 7 * 24 * 60 * 60 * 1000
    
    return {
      total: memoryHistory.length,
      todayCount: memoryHistory.filter(h => new Date(h.createdAt).getTime() >= todayStart).length,
      weekCount: memoryHistory.filter(h => new Date(h.createdAt).getTime() >= weekStart).length,
    }
  }

  /**
   * 视频收藏操作
   */

  async addVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<void> {
    const newItem = {
      ...item,
      id: `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    memoryFavorites.unshift(newItem)
  }

  async getAllVideoFavorites(): Promise<any[]> {
    return memoryFavorites
  }

  async isVideoFavorite(videoUrl: string): Promise<boolean> {
    return memoryFavorites.some(f => f.videoUrl === videoUrl)
  }

  async removeVideoFavorite(videoUrl: string): Promise<void> {
    const idx = memoryFavorites.findIndex(f => f.videoUrl === videoUrl)
    if (idx > -1) memoryFavorites.splice(idx, 1)
  }

  async clearVideoFavorites(): Promise<void> {
    memoryFavorites.length = 0
  }

  async toggleVideoFavorite(item: Omit<NewVideoFavorites, 'id' | 'createdAt'>): Promise<{ isFavorite: boolean }> {
    const isFav = await this.isVideoFavorite(item.videoUrl!)
    if (isFav) {
      await this.removeVideoFavorite(item.videoUrl!)
      return { isFavorite: false }
    } else {
      await this.addVideoFavorite(item)
      return { isFavorite: true }
    }
  }

  /**
   * 用户历史记录
   */

  async getUserVideoHistory(openid: string, page: number = 1, pageSize: number = 10): Promise<any[]> {
    const userHistory = memoryHistory.filter(h => h.openid === openid)
    const start = (page - 1) * pageSize
    return userHistory.slice(start, start + pageSize)
  }

  async getUserVideoFavorites(openid: string, page: number = 1, pageSize: number = 10): Promise<any[]> {
    const userFavs = memoryFavorites.filter(f => f.openid === openid)
    const start = (page - 1) * pageSize
    return userFavs.slice(start, start + pageSize)
  }

  async addUserVideoHistory(item: any): Promise<void> {
    return this.addVideoHistory(item)
  }

  async addUserVideoFavorite(item: any): Promise<void> {
    return this.addVideoFavorite(item)
  }

  // 别名方法
  async getUserHistory(openid: string, page?: number, pageSize?: number): Promise<any[]> {
    return this.getUserVideoHistory(openid, page, pageSize)
  }

  async getUserFavorites(openid: string, page?: number, pageSize?: number): Promise<any[]> {
    return this.getUserVideoFavorites(openid, page, pageSize)
  }

  async addUserHistory(item: any): Promise<void> {
    return this.addVideoHistory(item)
  }

  async addUserFavorite(item: any): Promise<void> {
    return this.addVideoFavorite(item)
  }

  // 初始化方法
  async initializeDatabase(): Promise<void> {
    // 内存存储不需要初始化
  }
}
