/**
 * 通用类型定义
 */

/**
 * API 响应结构
 */
export interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

/**
 * 分页参数
 */
export interface PaginationParams {
  page: number
  pageSize: number
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/**
 * 上传文件响应
 */
export interface UploadResponse {
  url: string
  fileKey: string
  filename: string
  size: number
  mimetype: string
}

/**
 * 视频生成任务状态
 */
export type VideoTaskStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled'

/**
 * 视频生成任务
 */
export interface VideoTask {
  id: string
  userId?: string
  images: string[]
  status: VideoTaskStatus
  progress: number
  videoUrl?: string
  copywriting?: string
  errorMessage?: string
  createdAt: string
  updatedAt: string
}

/**
 * 视频生成请求
 */
export interface VideoGenerateRequest {
  images: string[]
  userId?: string
}

/**
 * 视频生成响应
 */
export interface VideoGenerateResponse {
  videoUrl: string
  copywriting: string
  taskId?: string
}

/**
 * 用户信息
 */
export interface UserInfo {
  id?: string
  avatar: string
  nickname: string
  level: string
  videos: number
  likes: number
  points: number
  totalTime: string
  storageUsed: string
  storageTotal: string
  storagePercent: number
}

/**
 * 视频信息
 */
export interface VideoInfo {
  id: number
  title: string
  author: string
  avatar: string
  cover: string
  videoUrl: string
  views: number
  likes: number
  category: string
  tag: string
  time: string
  createdAt?: string
}
