import { Injectable } from '@nestjs/common';
import { S3Storage } from 'coze-coding-dev-sdk';

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
  private storage: S3Storage;
  private useLocalStorage: boolean = false;
  private uploadDir: string;

  constructor() {
    console.log('[UploadService] 初始化上传服务...');

    // 检查是否配置了对象存储
    const hasBucketConfig = process.env.COZE_BUCKET_ENDPOINT_URL && process.env.COZE_BUCKET_NAME;

    if (hasBucketConfig) {
      try {
        this.storage = new S3Storage({
          endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
          accessKey: "",
          secretKey: "",
          bucketName: process.env.COZE_BUCKET_NAME,
          region: "cn-beijing",
        });
        console.log('[UploadService] 对象存储初始化成功');
      } catch (error) {
        console.error('[UploadService] 对象存储初始化失败，使用本地存储:', error.message);
        this.useLocalStorage = true;
        this.initLocalStorage();
      }
    } else {
      console.log('[UploadService] 未配置对象存储，使用本地存储');
      this.useLocalStorage = true;
      this.initLocalStorage();
    }
  }

  private initLocalStorage() {
    const envUploadDir = process.env.UPLOAD_DIR;
    if (envUploadDir) {
      this.uploadDir = envUploadDir;
    } else {
      const cwd = process.cwd();
      if (cwd.includes('bytefaas') || cwd.includes('dist')) {
        this.uploadDir = '/tmp/uploads';
      } else {
        this.uploadDir = `${cwd}/uploads`;
      }
    }
    console.log('[UploadService] 本地存储目录:', this.uploadDir);
  }

  async upload(file: UploadedFile) {
    try {
      if (!file || !file.buffer) {
        throw new Error('文件为空');
      }

      console.log('[UploadService] 开始上传文件...');
      console.log('[UploadService] 文件信息:', {
        originalname: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

      // 生成文件名
      const timestamp = Date.now();
      const ext = file.originalname.split('.').pop() || 'jpg';
      const fileName = `uploads/${timestamp}.${ext}`;

      if (!this.useLocalStorage && this.storage) {
        // 使用对象存储
        console.log('[UploadService] 使用对象存储上传...');
        
        const fileKey = await this.storage.uploadFile({
          fileContent: file.buffer,
          fileName: fileName,
          contentType: file.mimetype,
        });

        console.log('[UploadService] 对象存储上传成功, key:', fileKey);

        // 生成签名URL（有效期7天）
        const signedUrl = await this.storage.generatePresignedUrl({
          key: fileKey,
          expireTime: 604800, // 7天
        });

        console.log('[UploadService] 生成签名URL成功');

        return {
          url: signedUrl,
          fileKey: fileKey,
          filename: fileName,
          size: file.size,
          mimetype: file.mimetype,
          storage: 's3'
        };
      } else {
        // 使用本地存储
        console.log('[UploadService] 使用本地存储上传...');
        
        const fs = require('fs');
        const path = require('path');

        // 确保目录存在
        if (!fs.existsSync(this.uploadDir)) {
          fs.mkdirSync(this.uploadDir, { recursive: true });
        }

        const filename = `${timestamp}.${ext}`;
        const filepath = path.join(this.uploadDir, filename);

        // 保存文件
        fs.writeFileSync(filepath, file.buffer);

        console.log('[UploadService] 本地存储成功:', filepath);

        return {
          url: `/api/uploads/${filename}`,
          fileKey: filename,
          filename: filename,
          size: file.size,
          mimetype: file.mimetype,
          storage: 'local'
        };
      }
    } catch (error) {
      console.error('[UploadService] 上传失败:', error);
      throw error;
    }
  }
}
