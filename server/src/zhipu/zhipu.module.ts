import { Module } from '@nestjs/common';
import { ZhipuService } from './zhipu.service';
import { ZhipuController } from './zhipu.controller';

@Module({
  providers: [ZhipuService],
  controllers: [ZhipuController],
  exports: [ZhipuService],
})
export class ZhipuModule {}
