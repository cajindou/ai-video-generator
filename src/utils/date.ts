/**
 * 日期时间工具
 * 提供常用的日期格式化和计算功能
 */

export namespace DateUtils {
  /**
   * 格式化日期时间
   * @param date 日期对象或时间戳
   * @param formatStr 格式字符串，默认 'YYYY-MM-DD HH:mm:ss'
   * @returns 格式化后的日期字符串
   */
  export const format = (date: Date | number | string = new Date(), formatStr: string = 'YYYY-MM-DD HH:mm:ss'): string => {
    const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return formatStr
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  /**
   * 格式化为相对时间（如：刚刚、5分钟前、1小时前）
   * @param date 日期对象或时间戳
   * @returns 相对时间字符串
   */
  export const formatRelative = (date: Date | number | string = new Date()): string => {
    const now = new Date()
    const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
    const diff = now.getTime() - d.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) {
      return '刚刚'
    } else if (minutes < 60) {
      return `${minutes}分钟前`
    } else if (hours < 24) {
      return `${hours}小时前`
    } else if (days < 7) {
      return `${days}天前`
    } else if (days < 30) {
      return `${Math.floor(days / 7)}周前`
    } else if (days < 365) {
      return `${Math.floor(days / 30)}个月前`
    } else {
      return `${Math.floor(days / 365)}年前`
    }
  }

  /**
   * 格式化时长（如：1:30, 2:45:30）
   * @param seconds 秒数
   * @returns 格式化后的时长
   */
  export const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    } else {
      return `${minutes}:${String(secs).padStart(2, '0')}`
    }
  }

  /**
   * 获取今日日期字符串
   */
  export const getToday = (): string => {
    return format(new Date(), 'YYYY-MM-DD')
  }

  /**
   * 获取当前时间戳
   */
  export const getTimestamp = (): number => {
    return Date.now()
  }

  /**
   * 判断是否为今天
   */
  export const isToday = (date: Date | number | string): boolean => {
    const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    )
  }

  /**
   * 判断是否为本周
   */
  export const isThisWeek = (date: Date | number | string): boolean => {
    const d = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)

    return d >= startOfWeek && d <= endOfWeek
  }
}
