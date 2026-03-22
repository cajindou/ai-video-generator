import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as path from 'path';
import { AppController } from '@/app.controller';
import { AppService } from '@/app.service';
import { UploadModule } from '@/upload/upload.module';
import { VideoModule } from '@/video/video.module';
import { VideoExpertModule } from '@/video-expert/video-expert.module';
import { ChatModule } from '@/chat/chat.module';
import { VIPModule } from '@/vip/vip.module';
import { DatabaseModule } from '@/database/database.module';
import { AuthModule } from '@/auth/auth.module';
import { ZhipuModule } from '@/zhipu/zhipu.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全局模块，所有服务都可以访问
      envFilePath: path.join(process.cwd(), '..', '.env.local'), // 使用绝对路径指向项目根目录
    }),
    UploadModule,
    VideoModule,
    VideoExpertModule,
    ChatModule,
    VIPModule,
    DatabaseModule,
    AuthModule,
    ZhipuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
