/**
 * 上传视频到对象存储
 */

import * as fs from 'fs';
import * as path from 'path';
import { S3Storage } from 'coze-coding-dev-sdk';

async function main() {
  console.log('========================================');
  console.log('上传视频到对象存储');
  console.log('========================================\n');
  
  // 初始化存储客户端
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });
  
  console.log('存储配置:', {
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    bucketName: process.env.COZE_BUCKET_NAME,
  });
  
  // 读取视频文件
  const videoPath = '/workspace/projects/assets/test_video_output.mp4';
  console.log('\n读取视频文件:', videoPath);
  
  const videoBuffer = fs.readFileSync(videoPath);
  console.log('视频大小:', (videoBuffer.length / 1024 / 1024).toFixed(2), 'MB');
  
  // 上传文件
  console.log('\n开始上传...');
  const key = await storage.uploadFile({
    fileContent: videoBuffer,
    fileName: `videos/test_video_${Date.now()}.mp4`,
    contentType: 'video/mp4',
  });
  
  console.log('上传成功! Key:', key);
  
  // 生成访问 URL
  const url = await storage.generatePresignedUrl({
    key: key,
    expireTime: 86400 * 7, // 7天有效期
  });
  
  console.log('\n========================================');
  console.log('视频访问 URL (有效期7天):');
  console.log(url);
  console.log('========================================');
  
  return { key, url };
}

main().catch(console.error);
