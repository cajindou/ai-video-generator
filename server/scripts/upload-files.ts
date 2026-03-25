import { S3Storage } from 'coze-coding-dev-sdk';
import * as fs from 'fs';

async function main() {
  console.log('🚀 上传文件并生成下载链接...\n');

  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 上传小程序包
  const weappFile = fs.readFileSync('/tmp/yuxuan-weapp-20260325233949.tar.gz');
  const weappKey = await storage.uploadFile({
    fileContent: weappFile,
    fileName: 'downloads/yuxuan-weapp.tar.gz',
    contentType: 'application/gzip',
  });
  const weappUrl = await storage.generatePresignedUrl({ key: weappKey, expireTime: 86400 * 30 }); // 30天

  // 上传完整项目
  const fullFile = fs.readFileSync('/tmp/yuxuan-full-project-20260325234032.tar.gz');
  const fullKey = await storage.uploadFile({
    fileContent: fullFile,
    fileName: 'downloads/yuxuan-full-project.tar.gz',
    contentType: 'application/gzip',
  });
  const fullUrl = await storage.generatePresignedUrl({ key: fullKey, expireTime: 86400 * 30 }); // 30天

  console.log('========================================');
  console.log('📱 小程序包下载链接 (30天有效):');
  console.log('========================================');
  console.log(weappUrl);
  console.log('\n');
  console.log('========================================');
  console.log('📁 完整项目源码下载链接 (30天有效):');
  console.log('========================================');
  console.log(fullUrl);
  
  return { weappUrl, fullUrl };
}

main().catch(console.error);
