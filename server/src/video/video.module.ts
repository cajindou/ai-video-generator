import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { VideoCallbackController } from './video-callback.controller';
import { VideoService } from './video.service';
import { VideoQueueService } from './video-queue.service';
import { VIPModule } from '../vip/vip.module';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [VIPModule, DatabaseModule],
  controllers: [VideoController, VideoCallbackController],
  providers: [VideoService, VideoQueueService],
  exports: [VideoService, VideoQueueService]
})
export class VideoModule {}
