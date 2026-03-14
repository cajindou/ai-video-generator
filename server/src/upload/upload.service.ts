import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

@Injectable()
export class UploadService {
  private uploadDir: string;

  constructor() {
    // 创建上传目录（适配开发和部署环境）
    // 在部署环境中，使用 /tmp/uploads 作为上传目录（可写且稳定）
    // 在开发环境中，使用 server/uploads

    console.log('[UploadService] 初始化上传目录...');

    // 优先使用环境变量配置的上传目录
    const envUploadDir = process.env.UPLOAD_DIR;

    if (envUploadDir) {
      // 使用环境变量指定的目录
      this.uploadDir = envUploadDir;
      console.log('[UploadService] 使用环境变量配置的上传目录:', this.uploadDir);
    } else {
      // 检测运行环境
      const cwd = process.cwd();

      // 在部署环境中，使用 /tmp/uploads
      if (cwd.includes('bytefaas') || cwd.includes('dist')) {
        this.uploadDir = '/tmp/uploads';
        console.log('[UploadService] 检测到部署环境，使用 /tmp/uploads');
      } else {
        // 开发环境：在 server 目录下创建 uploads
        this.uploadDir = path.join(cwd, 'uploads');
        console.log('[UploadService] 检测到开发环境，使用', this.uploadDir);
      }
    }

    console.log('[UploadService] 工作目录:', process.cwd());
    console.log('[UploadService] 上传目录:', this.uploadDir);

    // 确保目录存在（递归创建）
    try {
      if (!fs.existsSync(this.uploadDir)) {
        console.log('[UploadService] 创建上传目录:', this.uploadDir);

        // 确保父目录存在
        const parentDir = path.dirname(this.uploadDir);
        if (!fs.existsSync(parentDir)) {
          console.log('[UploadService] 创建父目录:', parentDir);
          fs.mkdirSync(parentDir, { recursive: true });
        }

        // 创建目标目录
        fs.mkdirSync(this.uploadDir, { recursive: true });
        console.log('[UploadService] 上传目录创建成功');
      } else {
        console.log('[UploadService] 上传目录已存在');
      }
    } catch (error) {
      console.error('[UploadService] 创建上传目录失败:', error.message);
      console.error('[UploadService] 错误堆栈:', error.stack);

      // 尝试使用备用目录
      const fallbackDir = '/tmp/uploads';
      console.log('[UploadService] 尝试使用备用目录:', fallbackDir);

      try {
        if (!fs.existsSync(fallbackDir)) {
          fs.mkdirSync(fallbackDir, { recursive: true });
        }
        this.uploadDir = fallbackDir;
        console.log('[UploadService] 成功切换到备用目录:', this.uploadDir);
      } catch (fallbackError) {
        console.error('[UploadService] 备用目录创建也失败:', fallbackError.message);
        throw new Error(`无法创建上传目录: ${this.uploadDir} 和 ${fallbackDir} 均失败`);
      }
    }
  }

  async upload(file: UploadedFile) {
    try {
      if (!file || !file.buffer) {
        throw new Error('文件为空');
      }

      console.log('[UploadService] 开始保存文件...');

      // 生成唯一文件名
      const timestamp = Date.now();
      const ext = path.extname(file.originalname);
      const filename = `${timestamp}${ext}`;
      const filepath = path.join(this.uploadDir, filename);

      // 保存文件到本地
      fs.writeFileSync(filepath, file.buffer);

      console.log('[UploadService] 文件保存成功:', filename);
      console.log('[UploadService] 文件路径:', filepath);

      // 返回文件URL
      // 使用相对路径，让前端根据环境拼接完整 URL
      const publicUrl = `/api/uploads/${filename}`;

      console.log('[UploadService] 生成的URL:', publicUrl);

      return {
        url: publicUrl,
        fileKey: filename,
        filename: filename,
        size: file.size,
        mimetype: file.mimetype
      };
    } catch (error) {
      console.error('[UploadService] 保存文件失败:', error);
      throw error;
    }
  }
}
