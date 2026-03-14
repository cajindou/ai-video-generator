import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common'
import { DatabaseService } from './database.service'
import { ResponseHelper } from '@/common/response.helper'

@Controller('database')
export class DatabaseController {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * ========================
   * 视频历史记录接口
   * ========================
   */

  /**
   * 获取所有历史记录
   */
  @Get('history')
  async getAllVideoHistory() {
    const history = await this.databaseService.getAllVideoHistory()
    return ResponseHelper.success(history)
  }

  /**
   * 获取分页历史记录
   */
  @Get('history/paginated')
  async getPaginatedVideoHistory(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10
    const result = await this.databaseService.getPaginatedVideoHistory(pageNum, pageSizeNum)
    return ResponseHelper.success(result)
  }

  /**
   * 添加历史记录
   */
  @Post('history')
  async addVideoHistory(@Body() body: any) {
    await this.databaseService.addVideoHistory(body)
    return ResponseHelper.success(null, '历史记录添加成功')
  }

  /**
   * 删除历史记录
   */
  @Delete('history/:id')
  async removeVideoHistory(@Param('id') id: string) {
    await this.databaseService.removeVideoHistory(id)
    return ResponseHelper.success(null, '历史记录删除成功')
  }

  /**
   * 清空所有历史记录
   */
  @Delete('history')
  async clearVideoHistory() {
    await this.databaseService.clearVideoHistory()
    return ResponseHelper.success(null, '历史记录已清空')
  }

  /**
   * 获取历史记录统计信息
   */
  @Get('history/stats')
  async getVideoHistoryStats() {
    const stats = await this.databaseService.getVideoHistoryStats()
    return ResponseHelper.success(stats)
  }

  /**
   * ========================
   * 视频收藏接口
   * ========================
   */

  /**
   * 获取所有收藏
   */
  @Get('favorites')
  async getAllVideoFavorites() {
    const favorites = await this.databaseService.getAllVideoFavorites()
    return ResponseHelper.success(favorites)
  }

  /**
   * 检查是否已收藏
   */
  @Get('favorites/check')
  async isVideoFavorite(@Query('videoUrl') videoUrl: string) {
    const isFav = await this.databaseService.isVideoFavorite(videoUrl)
    return ResponseHelper.success({ isFavorite: isFav })
  }

  /**
   * 添加收藏
   */
  @Post('favorites')
  async addVideoFavorite(@Body() body: any) {
    await this.databaseService.addVideoFavorite(body)
    return ResponseHelper.success(null, '收藏添加成功')
  }

  /**
   * 删除收藏
   */
  @Delete('favorites')
  async removeVideoFavorite(@Body() body: { videoUrl: string }) {
    await this.databaseService.removeVideoFavorite(body.videoUrl)
    return ResponseHelper.success(null, '收藏删除成功')
  }

  /**
   * 清空所有收藏
   */
  @Delete('favorites/clear')
  async clearVideoFavorites() {
    await this.databaseService.clearVideoFavorites()
    return ResponseHelper.success(null, '收藏已清空')
  }

  /**
   * 切换收藏状态
   */
  @Post('favorites/toggle')
  async toggleVideoFavorite(@Body() body: any) {
    const isFav = await this.databaseService.toggleVideoFavorite(body)
    return ResponseHelper.success({ isFavorite: isFav }, isFav ? '已收藏' : '已取消收藏')
  }

  /**
   * ========================
   * 用户专属接口
   * ========================
   */

  /**
   * 获取用户历史记录
   */
  @Get('history/user')
  async getUserVideoHistory(
    @Query('openid') openid: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!openid) {
      return ResponseHelper.badRequest('openid 不能为空')
    }

    const pageNum = page ? parseInt(page, 10) : 1
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10
    const result = await this.databaseService.getUserVideoHistory(openid, pageNum, pageSizeNum)
    return ResponseHelper.success(result)
  }

  /**
   * 获取用户收藏
   */
  @Get('favorites/user')
  async getUserVideoFavorites(
    @Query('openid') openid: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    if (!openid) {
      return ResponseHelper.badRequest('openid 不能为空')
    }

    const pageNum = page ? parseInt(page, 10) : 1
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : 10
    const result = await this.databaseService.getUserVideoFavorites(openid, pageNum, pageSizeNum)
    return ResponseHelper.success(result)
  }

  /**
   * 添加用户历史记录
   */
  @Post('history/user')
  async addUserVideoHistory(@Body() body: any) {
    if (!body.openid) {
      return ResponseHelper.badRequest('openid 不能为空')
    }
    await this.databaseService.addUserVideoHistory(body)
    return ResponseHelper.success(null, '历史记录添加成功')
  }

  /**
   * 添加用户收藏
   */
  @Post('favorites/user')
  async addUserVideoFavorite(@Body() body: any) {
    if (!body.openid) {
      return ResponseHelper.badRequest('openid 不能为空')
    }
    const isFav = await this.databaseService.addUserVideoFavorite(body)
    return ResponseHelper.success({ isFavorite: isFav }, isFav ? '已收藏' : '已取消收藏')
  }
}
