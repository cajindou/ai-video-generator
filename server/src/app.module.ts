import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import * as fs from 'fs';
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

// 获取上传目录（与 UploadService 保持一致）
function getUploadDir(): string {
  const envUploadDir = process.env.UPLOAD_DIR;
  if (envUploadDir) {
    return envUploadDir;
  }

  const cwd = process.cwd();
  if (cwd.includes('bytefaas') || cwd.includes('dist')) {
    return '/tmp/uploads';
  }

  return path.join(cwd, 'uploads');
}

const uploadDir = getUploadDir();

// 检查上传目录是否存在，如果不存在则创建
if (!fs.existsSync(uploadDir)) {
  try {
    fs.mkdirSync(uploadDir, { recursive: true });
  } catch (error) {
    console.warn('[AppModule] 无法创建上传目录:', error.message);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 全局模块，所有服务都可以访问
      envFilePath: path.join(process.cwd(), '..', '.env.local'), // 使用绝对路径指向项目根目录
    }),
    // 只在上传目录存在时配置静态文件服务
    ...(fs.existsSync(uploadDir)
      ? [
          ServeStaticModule.forRoot({
            rootPath: uploadDir,
            serveRoot: '/api/uploads',
          }),
        ]
      : []),
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
