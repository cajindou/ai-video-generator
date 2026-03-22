/**
 * 统一响应工具
 * 封装常用的 API 响应格式
 */

export class ResponseHelper {
  /**
   * 成功响应
   */
  static success<T = any>(data?: T, msg: string = 'success') {
    return {
      code: 200,
      msg,
      data
    }
  }

  /**
   * 失败响应
   */
  static fail(code: number = 500, msg: string = '操作失败', data?: any) {
    return {
      code,
      msg,
      data
    }
  }

  /**
   * 参数错误响应
   */
  static badRequest(msg: string = '参数错误', data?: any) {
    return this.fail(400, msg, data)
  }

  /**
   * 未授权响应
   */
  static unauthorized(msg: string = '未授权', data?: any) {
    return this.fail(401, msg, data)
  }

  /**
   * 禁止访问响应
   */
  static forbidden(msg: string = '禁止访问', data?: any) {
    return this.fail(403, msg, data)
  }

  /**
   * 资源不存在响应
   */
  static notFound(msg: string = '资源不存在', data?: any) {
    return this.fail(404, msg, data)
  }

  /**
   * 服务器错误响应
   */
  static serverError(msg: string = '服务器错误', data?: any) {
    return this.fail(500, msg, data)
  }

  /**
   * 服务不可用响应
   */
  static serviceUnavailable(msg: string = '服务不可用', data?: any) {
    return this.fail(503, msg, data)
  }
}
