/**
 * 数据库服务
 * 使用后端数据库存储数据，替代本地存储
 */

import { Network } from '@/network'

// API 响应类型
interface ApiResponse<T> {
  code: number
  msg: string
  data: T
}

export interface VideoHistoryItem {
  id: string
  storeName?: string
  images?: string[]
  imageUrls?: string[]
  videoUrl: string
  copywriting?: string
  thumbnail?: string
  createdAt: string
}

export interface VideoFavoriteItem {
  id: string
  videoUrl: string
  storeName?: string
  coverImage?: string
  thumbnail?: string
  title?: string
  author?: string
  avatar?: string
  views?: number
  likes?: number
  category?: string
  createdAt: string
}

export namespace Database {
  /**
   * ========================
   * 视频历史记录操作
   * ========================
   */

  /**
   * 添加历史记录
   */
  export const addVideoHistory = async (
    item: Omit<VideoHistoryItem, 'id' | 'createdAt'>
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: '/api/database/history',
        method: 'POST',
        data: item,
      })

      return response.data
    } catch (error) {
      console.error('[Database] 添加历史记录失败:', error)
      return { code: 500, msg: '添加历史记录失败', data: null }
    }
  }

  /**
   * 获取所有历史记录
   */
  export const getAllVideoHistory = async (): Promise<ApiResponse<VideoHistoryItem[]>> => {
    try {
      const response = await Network.request({
        url: '/api/database/history',
        method: 'GET',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 获取历史记录失败:', error)
      return { code: 500, msg: '获取历史记录失败', data: [] }
    }
  }

  /**
   * 获取分页历史记录
   */
  export const getPaginatedVideoHistory = async (
    page: number = 1,
    pageSize: number = 10
  ): Promise<ApiResponse<{
    list: VideoHistoryItem[]
    total: number
    page: number
    pageSize: number
  }>> => {
    try {
      const response = await Network.request({
        url: '/api/database/history/paginated',
        method: 'GET',
        data: { page, pageSize },
      })

      return response.data
    } catch (error) {
      console.error('[Database] 获取分页历史记录失败:', error)
      return { code: 500, msg: '获取分页历史记录失败', data: { list: [], total: 0, page, pageSize } }
    }
  }

  /**
   * 删除历史记录
   */
  export const removeVideoHistory = async (id: string): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: `/api/database/history/${id}`,
        method: 'DELETE',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 删除历史记录失败:', error)
      return { code: 500, msg: '删除历史记录失败', data: null }
    }
  }

  /**
   * 清空所有历史记录
   */
  export const clearVideoHistory = async (): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: '/api/database/history',
        method: 'DELETE',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 清空历史记录失败:', error)
      return { code: 500, msg: '清空历史记录失败', data: null }
    }
  }

  /**
   * 获取统计信息
   */
  export const getVideoHistoryStats = async (): Promise<ApiResponse<{
    total: number
    todayCount: number
    weekCount: number
  }>> => {
    try {
      const response = await Network.request({
        url: '/api/database/history/stats',
        method: 'GET',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 获取统计信息失败:', error)
      return { code: 500, msg: '获取统计信息失败', data: { total: 0, todayCount: 0, weekCount: 0 } }
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
  export const addVideoFavorite = async (
    item: Omit<VideoFavoriteItem, 'id' | 'createdAt'>
  ): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites',
        method: 'POST',
        data: item,
      })

      return response.data
    } catch (error) {
      console.error('[Database] 添加收藏失败:', error)
      return { code: 500, msg: '添加收藏失败', data: null }
    }
  }

  /**
   * 获取所有收藏
   */
  export const getAllVideoFavorites = async (): Promise<ApiResponse<VideoFavoriteItem[]>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites',
        method: 'GET',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 获取收藏失败:', error)
      return { code: 500, msg: '获取收藏失败', data: [] }
    }
  }

  /**
   * 检查是否已收藏
   */
  export const isVideoFavorite = async (videoUrl: string): Promise<ApiResponse<{ isFavorite: boolean }>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites/check',
        method: 'GET',
        data: { videoUrl },
      })

      return response.data
    } catch (error) {
      console.error('[Database] 检查收藏状态失败:', error)
      return { code: 500, msg: '检查收藏状态失败', data: { isFavorite: false } }
    }
  }

  /**
   * 删除收藏
   */
  export const removeVideoFavorite = async (videoUrl: string): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites',
        method: 'DELETE',
        data: { videoUrl },
      })

      return response.data
    } catch (error) {
      console.error('[Database] 删除收藏失败:', error)
      return { code: 500, msg: '删除收藏失败', data: null }
    }
  }

  /**
   * 清空所有收藏
   */
  export const clearVideoFavorites = async (): Promise<ApiResponse<null>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites/clear',
        method: 'DELETE',
      })

      return response.data
    } catch (error) {
      console.error('[Database] 清空收藏失败:', error)
      return { code: 500, msg: '清空收藏失败', data: null }
    }
  }

  /**
   * 切换收藏状态
   */
  export const toggleVideoFavorite = async (
    item: Omit<VideoFavoriteItem, 'id' | 'createdAt'>
  ): Promise<ApiResponse<{ isFavorite: boolean }>> => {
    try {
      const response = await Network.request({
        url: '/api/database/favorites/toggle',
        method: 'POST',
        data: item,
      })

      return response.data
    } catch (error) {
      console.error('[Database] 切换收藏状态失败:', error)
      return { code: 500, msg: '切换收藏状态失败', data: { isFavorite: false } }
    }
  }
}

// 导出别名，方便使用
export const DatabaseHelper = Database
