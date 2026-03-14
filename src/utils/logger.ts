/**
 * 日志工具
 * 统一日志输出格式，支持不同级别
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

let currentLevel: LogLevel = LogLevel.DEBUG
let enableConsole = true

export namespace Logger {
  /**
   * 设置日志级别
   */
  export const setLevel = (level: LogLevel): void => {
    currentLevel = level
  }

  /**
   * 启用/禁用控制台输出
   */
  export const setEnableConsole = (enable: boolean): void => {
    enableConsole = enable
  }

  /**
   * 获取时间戳
   */
  const getTimestamp = (): string => {
    const now = new Date()
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    return `${hours}:${minutes}:${seconds}.${ms}`
  }

  /**
   * 格式化日志输出
   */
  const formatLog = (level: string, module: string, message: string, ...args: any[]): void => {
    if (!enableConsole || currentLevel > LogLevel[level as keyof typeof LogLevel]) {
      return
    }

    const timestamp = getTimestamp()
    const prefix = `[${timestamp}] [${level}] [${module}]`
    
    if (args.length > 0) {
      console.log(prefix, message, ...args)
    } else {
      console.log(prefix, message)
    }
  }

  /**
   * DEBUG 级别日志
   */
  export const debug = (module: string, message: string, ...args: any[]): void => {
    formatLog('DEBUG', module, message, ...args)
  }

  /**
   * INFO 级别日志
   */
  export const info = (module: string, message: string, ...args: any[]): void => {
    formatLog('INFO', module, message, ...args)
  }

  /**
   * WARN 级别日志
   */
  export const warn = (module: string, message: string, ...args: any[]): void => {
    formatLog('WARN', module, message, ...args)
  }

  /**
   * ERROR 级别日志
   */
  export const error = (module: string, message: string, ...args: any[]): void => {
    formatLog('ERROR', module, message, ...args)
  }

  /**
   * 成功日志（绿色输出）
   */
  export const success = (module: string, message: string, ...args: any[]): void => {
    if (!enableConsole || currentLevel > LogLevel.INFO) {
      return
    }

    const timestamp = getTimestamp()
    const prefix = `\x1b[32m[${timestamp}] [SUCCESS] [${module}]\x1b[0m`
    
    if (args.length > 0) {
      console.log(prefix, message, ...args)
    } else {
      console.log(prefix, message)
    }
  }

  /**
   * 性能日志
   */
  export const performance = (module: string, operation: string, startTime: number): void => {
    const endTime = Date.now()
    const duration = endTime - startTime
    info(module, `${operation} 耗时: ${duration}ms`)
  }
}

// 设置默认日志级别
// 在开发环境使用 DEBUG，生产环境使用 INFO
// @ts-ignore
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : true
if (isDev) {
  Logger.setLevel(LogLevel.DEBUG)
} else {
  Logger.setLevel(LogLevel.INFO)
}
