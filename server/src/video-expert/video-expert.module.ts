import { Module } from '@nestjs/common';
import { VideoExpertController } from './video-expert.controller';
import { VideoExpertService } from './video-expert.service';
import { ExpertPipelineController } from './expert-pipeline.controller';
import { ExpertPipelineService } from './expert-pipeline.service';

@Module({
  controllers: [VideoExpertController, ExpertPipelineController],
  providers: [VideoExpertService, ExpertPipelineService],
  exports: [VideoExpertService, ExpertPipelineService],
})
export class VideoExpertModule {}
