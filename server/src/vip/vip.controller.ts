import { Controller, Get, Post, Body, Query } from '@nestjs/common'
import { VIPService } from './vip.service'
import { Logger } from '@/common/logger'

@Controller('vip')
export class VIPController {
  private readonly logger = new Logger(VIPController.name)

  constructor(private readonly vipService: VIPService) {}

  /**
   * 获取用户配额信息
   */
  @Get('quota')
  async getQuota(@Query('openid') openid: string) {
    this.logger.info(`获取用户配额: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const quota = await this.vipService.getUserQuota(openid)

    return {
      code: 200,
      msg: '获取成功',
      data: quota,
    }
  }

  /**
   * 检查用户配额
   */
  @Get('check-quota')
  async checkQuota(@Query('openid') openid: string) {
    this.logger.info(`检查用户配额: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const hasQuota = await this.vipService.checkUserQuota(openid)

    return {
      code: 200,
      msg: '检查成功',
      data: {
        hasQuota,
      },
    }
  }

  /**
   * 获取所有会员套餐
   */
  @Get('plans')
  async getPlans() {
    this.logger.info('获取所有会员套餐')

    const plans = await this.vipService.getAllActivePlans()

    return {
      code: 200,
      msg: '获取成功',
      data: plans,
    }
  }

  /**
   * 获取用户信息（根据openid）
   */
  @Get('user')
  async getUser(@Query('openid') openid: string) {
    this.logger.info(`获取用户信息: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const user = await this.vipService.getUserByOpenid(openid)

    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }

    return {
      code: 200,
      msg: '获取成功',
      data: user,
    }
  }

  /**
   * 获取用户订单列表
   */
  @Get('orders')
  async getOrders(@Query('openid') openid: string) {
    this.logger.info(`获取用户订单: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const orders = await this.vipService.getUserOrders(openid)

    return {
      code: 200,
      msg: '获取成功',
      data: orders,
    }
  }

  /**
   * ========================
   * 管理员接口
   * ========================
   */

  /**
   * 手动开通会员（管理员接口）
   */
  @Post('admin/activate')
  async activateVIP(@Body() body: { openid: string; planId: string }) {
    this.logger.info(`手动开通会员: openid=${body.openid}, planId=${body.planId}`)

    if (!body.openid || !body.planId) {
      return {
        code: 400,
        msg: 'openid 和 planId 不能为空',
        data: null,
      }
    }

    try {
      const result = await this.vipService.activateVIP(body.openid, body.planId)

      return {
        code: 200,
        msg: '会员开通成功',
        data: result,
      }
    } catch (error: any) {
      this.logger.error(`开通会员失败: ${error.message}`)

      return {
        code: 500,
        msg: error.message || '开通失败',
        data: null,
      }
    }
  }

  /**
   * 查询用户信息（管理员接口）
   */
  @Get('admin/user')
  async adminGetUser(@Query('openid') openid: string) {
    this.logger.info(`管理员查询用户: openid=${openid}`)

    if (!openid) {
      return {
        code: 400,
        msg: 'openid 不能为空',
        data: null,
      }
    }

    const user = await this.vipService.getUserByOpenid(openid)

    if (!user) {
      return {
        code: 404,
        msg: '用户不存在',
        data: null,
      }
    }

    return {
      code: 200,
      msg: '获取成功',
      data: user,
    }
  }

  /**
   * 获取所有订单（管理员接口）
   */
  @Get('admin/orders')
  async getAllOrders(@Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    this.logger.info('管理员获取所有订单')

    const pageNum = parseInt(page || '1', 10)
    const pageSizeNum = parseInt(pageSize || '20', 10)

    const result = await this.vipService.getAllOrders(pageNum, pageSizeNum)

    return {
      code: 200,
      msg: '获取成功',
      data: result,
    }
  }
}
