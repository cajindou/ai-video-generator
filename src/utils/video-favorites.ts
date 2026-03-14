/**
 * 收藏管理
 * 使用本地存储管理视频收藏
 */

import { Storage } from './storage'

export interface VideoFavoriteItem {
  id: string
  videoUrl: string
  thumbnail: string
  title: string
  author: string
  avatar: string
  views: number
  likes: number
  category: string
  createdAt: number
}

export namespace VideoFavorites {
  const STORAGE_KEY = 'video_favorites'

  /**
   * 添加收藏
   */
  export const add = async (item: Omit<VideoFavoriteItem, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const favorites = await getAll()
      
      // 检查是否已存在
      const exists = favorites.some(fav => fav.videoUrl === item.videoUrl)
      if (exists) {
        return
      }
      
      const newItem: VideoFavoriteItem = {
        ...item,
        id: `favorite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now()
      }
      
      favorites.unshift(newItem)
      await Storage.set(STORAGE_KEY, favorites)
    } catch (error) {
      console.error('添加收藏失败:', error)
    }
  }

  /**
   * 获取所有收藏
   */
  export const getAll = async (): Promise<VideoFavoriteItem[]> => {
    try {
      return await Storage.get<VideoFavoriteItem[]>(STORAGE_KEY, [])
    } catch (error) {
      console.error('获取收藏失败:', error)
      return []
    }
  }

  /**
   * 检查是否已收藏
   */
  export const isFavorite = async (videoUrl: string): Promise<boolean> => {
    try {
      const favorites = await getAll()
      return favorites.some(fav => fav.videoUrl === videoUrl)
    } catch (error) {
      console.error('检查收藏状态失败:', error)
      return false
    }
  }

  /**
   * 删除收藏
   */
  export const remove = async (videoUrl: string): Promise<void> => {
    try {
      const favorites = await getAll()
      const filtered = favorites.filter(fav => fav.videoUrl !== videoUrl)
      await Storage.set(STORAGE_KEY, filtered)
    } catch (error) {
      console.error('删除收藏失败:', error)
    }
  }

  /**
   * 清空所有收藏
   */
  export const clear = async (): Promise<void> => {
    try {
      await Storage.set(STORAGE_KEY, [])
    } catch (error) {
      console.error('清空收藏失败:', error)
    }
  }

  /**
   * 切换收藏状态
   */
  export const toggle = async (item: Omit<VideoFavoriteItem, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const isFav = await isFavorite(item.videoUrl)
      if (isFav) {
        await remove(item.videoUrl)
        return false
      } else {
        await add(item)
        return true
      }
    } catch (error) {
      console.error('切换收藏状态失败:', error)
      return false
    }
  }
}
