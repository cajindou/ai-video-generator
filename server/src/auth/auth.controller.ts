import { Controller, Post, Body, Get, Query } from '@nestjs/common'
import { AuthService } from './auth.service'
import { Logger } from '@/common/logger'
import { ResponseHelper } from '@/common/response.helper'

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name)

  constructor(private readonly authService: AuthService) {}

  /**
   * 微信小程序登录/注册
   */
  @Post('weapp/login')
  async weappLogin(@Body() body: {
    code: string
    userInfo?: {
      nickName?: string
      avatarUrl?: string
    }
  }) {
    this.logger.info(`微信小程序登录: code=${body.code}`)

    if (!body.code) {
      return {
        code: 400,
        msg: 'code 不能为空',
        data: null,
      }
    }

    try {
      const result = await this.authService.weappLogin(body.code, body.userInfo)

      return {
        code: 200,
        msg: result.isNewUser ? '注册成功' : '登录成功',
        data: result,
      }
    } catch (error: any) {
      this.logger.error(`登录失败: ${error.message}`)

      return {
        code: 500,
        msg: error.message || '登录失败',
        data: null,
      }
    }
  }

  /**
   * 获取用户信息
   */
  @Get('user')
  async getUserInfo(@Query('openid') openid: string) {
    this.logger.info(`获取用户信息: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const userInfo = await this.authService.getUserInfo(openid)

    if (!userInfo) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }

    return {
      code: 200,
      msg: '获取成功',
      data: userInfo,
    }
  }
}
