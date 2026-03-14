/**
 * 历史记录管理
 * 使用本地存储管理视频生成历史
 */

import { Storage } from './storage'

export interface VideoHistoryItem {
  id: string
  images: string[]
  videoUrl: string
  copywriting: string
  thumbnail: string
  createdAt: number
}

export namespace VideoHistory {
  const STORAGE_KEY = 'video_history'
  const MAX_HISTORY = 50

  /**
   * 添加历史记录
   */
  export const add = async (item: Omit<VideoHistoryItem, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const history = await getAll()
      
      const newItem: VideoHistoryItem = {
        ...item,
        id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now()
      }
      
      // 添加到开头
      history.unshift(newItem)
      
      // 限制数量
      if (history.length > MAX_HISTORY) {
        history.splice(MAX_HISTORY)
      }
      
      await Storage.set(STORAGE_KEY, history)
    } catch (error) {
      console.error('添加历史记录失败:', error)
    }
  }

  /**
   * 获取所有历史记录
   */
  export const getAll = async (): Promise<VideoHistoryItem[]> => {
    try {
      return await Storage.get<VideoHistoryItem[]>(STORAGE_KEY, [])
    } catch (error) {
      console.error('获取历史记录失败:', error)
      return []
    }
  }

  /**
   * 获取分页历史记录
   */
  export const getPaginated = async (page: number = 1, pageSize: number = 10): Promise<{
    list: VideoHistoryItem[]
    total: number
    page: number
    pageSize: number
  }> => {
    try {
      const history = await getAll()
      const total = history.length
      const start = (page - 1) * pageSize
      const list = history.slice(start, start + pageSize)
      
      return { list, total, page, pageSize }
    } catch (error) {
      console.error('获取分页历史记录失败:', error)
      return { list: [], total: 0, page, pageSize }
    }
  }

  /**
   * 删除历史记录
   */
  export const remove = async (id: string): Promise<void> => {
    try {
      const history = await getAll()
      const filtered = history.filter(item => item.id !== id)
      await Storage.set(STORAGE_KEY, filtered)
    } catch (error) {
      console.error('删除历史记录失败:', error)
    }
  }

  /**
   * 清空所有历史记录
   */
  export const clear = async (): Promise<void> => {
    try {
      await Storage.set(STORAGE_KEY, [])
    } catch (error) {
      console.error('清空历史记录失败:', error)
    }
  }

  /**
   * 获取统计信息
   */
  export const getStats = async (): Promise<{
    total: number
    todayCount: number
    weekCount: number
  }> => {
    try {
      const history = await getAll()
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      weekStart.setHours(0, 0, 0, 0)

      const todayCount = history.filter(item => item.createdAt >= todayStart.getTime()).length
      const weekCount = history.filter(item => item.createdAt >= weekStart.getTime()).length

      return {
        total: history.length,
        todayCount,
        weekCount
      }
    } catch (error) {
      console.error('获取统计信息失败:', error)
      return { total: 0, todayCount: 0, weekCount: 0 }
    }
  }
}
