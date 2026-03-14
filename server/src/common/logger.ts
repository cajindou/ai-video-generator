/**
 * 日志工具
 * 统一的日志输出格式
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

let currentLevel: LogLevel = LogLevel.DEBUG

export class Logger {
  private module: string

  constructor(module: string) {
    this.module = module
  }

  /**
   * 设置全局日志级别
   */
  static setLevel(level: LogLevel): void {
    currentLevel = level
  }

  /**
   * 获取时间戳
   */
  private getTimestamp(): string {
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
  private format(level: string, message: string, ...args: any[]): void {
    if (currentLevel > LogLevel[level as keyof typeof LogLevel]) {
      return
    }

    const timestamp = this.getTimestamp()
    const prefix = `[${timestamp}] [${level}] [${this.module}]`
    
    switch (level) {
      case 'ERROR':
        console.error(prefix, message, ...args)
        break
      case 'WARN':
        console.warn(prefix, message, ...args)
        break
      default:
        console.log(prefix, message, ...args)
    }
  }

  /**
   * DEBUG 级别日志
   */
  debug(message: string, ...args: any[]): void {
    this.format('DEBUG', message, ...args)
  }

  /**
   * INFO 级别日志
   */
  info(message: string, ...args: any[]): void {
    this.format('INFO', message, ...args)
  }

  /**
   * WARN 级别日志
   */
  warn(message: string, ...args: any[]): void {
    this.format('WARN', message, ...args)
  }

  /**
   * ERROR 级别日志
   */
  error(message: string, ...args: any[]): void {
    this.format('ERROR', message, ...args)
  }

  /**
   * 成功日志
   */
  success(message: string, ...args: any[]): void {
    if (currentLevel > LogLevel.INFO) {
      return
    }

    const timestamp = this.getTimestamp()
    const prefix = `\x1b[32m[${timestamp}] [SUCCESS] [${this.module}]\x1b[0m`
    console.log(prefix, message, ...args)
  }

  /**
   * 性能日志
   */
  performance(operation: string, startTime: number): void {
    const endTime = Date.now()
    const duration = endTime - startTime
    this.info(`${operation} 耗时: ${duration}ms`)
  }
}

// 设置默认日志级别
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(LogLevel.INFO)
} else {
  Logger.setLevel(LogLevel.DEBUG)
}
