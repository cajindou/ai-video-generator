import { S3Storage } from 'coze-coding-dev-sdk';
import * as fs from 'fs';
import * as path from 'path';

async function uploadFile(filePath: string, category: string) {
  console.log(`\n🚀 开始上传: ${category}`);

  // 初始化存储
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 读取文件
  const fileContent = fs.readFileSync(filePath);
  const fileName = `${category}/yuxuan-${category}-${Date.now()}.tar.gz`;

  console.log(`📦 文件大小: ${(fileContent.length / 1024 / 1024).toFixed(2)} MB`);

  // 上传文件
  const key = await storage.uploadFile({
    fileContent,
    fileName,
    contentType: 'application/gzip',
  });

  console.log(`✅ 上传成功! Key: ${key}`);

  // 生成下载链接 (有效期7天)
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60, // 7天
  });

  console.log(`🔗 下载链接 (7天有效):`);
  console.log(downloadUrl);

  return { key, downloadUrl };
}

async function main() {
  console.log('='.repeat(60));
  console.log('📦 宇轩百货小程序文件上传');
  console.log('='.repeat(60));

  // 上传小程序包
  const weappResult = await uploadFile('/tmp/yuxuan-weapp-20260325233949.tar.gz', 'weapp');
  
  // 上传完整项目
  const fullResult = await uploadFile('/tmp/yuxuan-full-project-20260325234032.tar.gz', 'full-project');

  console.log('\n' + '='.repeat(60));
  console.log('🎉 全部上传完成!');
  console.log('='.repeat(60));
  console.log('\n📱 小程序包下载链接:');
  console.log(weappResult.downloadUrl);
  console.log('\n📁 完整项目源码下载链接:');
  console.log(fullResult.downloadUrl);
}

main().catch((err) => {
  console.error('❌ 上传失败:', err);
  process.exit(1);
});
