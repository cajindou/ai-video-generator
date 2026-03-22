import { Module } from '@nestjs/common'
import { VIPController } from './vip.controller'
import { VIPService } from './vip.service'
import { DatabaseModule } from '@/database/database.module'

@Module({
  imports: [DatabaseModule],
  controllers: [VIPController],
  providers: [VIPService],
  exports: [VIPService],
})
export class VIPModule {}
