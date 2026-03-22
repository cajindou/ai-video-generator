import { Controller, Post, Body } from '@nestjs/common';
import { VideoQueueService } from './video-queue.service';

@Controller('video')
export class VideoCallbackController {
  constructor(private readonly queueService: VideoQueueService) {}

  /**
   * 接收视频生成完成后的回调
   */
  @Post('callback')
  async handleCallback(@Body() body: any) {
    console.log('收到视频生成回调:', body);

    try {
      const { id: taskId, status, content } = body;

      if (!taskId) {
        console.error('回调缺少任务ID');
        return { code: 400, msg: 'Missing task ID' };
      }

      // 查找对应的任务
      const task = this.queueService.getTask(taskId);

      if (!task) {
        console.warn(`未找到任务: ${taskId}`);
        return { code: 404, msg: 'Task not found' };
      }

      // 更新任务状态
      if (status === 'succeeded' && content?.video_url) {
        this.queueService.updateTask(taskId, {
          status: 'completed',
          progress: 100,
          result: {
            videoUrl: content.video_url,
          },
        });

        console.log(`任务 ${taskId} 已完成`);
      } else if (status === 'failed') {
        this.queueService.updateTask(taskId, {
          status: 'failed',
          error: body.error_message || '视频生成失败',
        });

        console.log(`任务 ${taskId} 失败: ${body.error_message}`);
      } else {
        // 更新进度
        this.queueService.updateTask(taskId, {
          progress: Math.min(task.progress + 10, 90),
        });
      }

      // 标记任务处理完成
      this.queueService.completeTask(taskId);

      return { code: 200, msg: 'success' };
    } catch (error) {
      console.error('处理回调失败:', error);
      return { code: 500, msg: 'Internal server error' };
    }
  }
}
