import { S3Storage } from 'coze-coding-dev-sdk';
import * as fs from 'fs';

async function main() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 删除旧文件
  console.log('🗑️ 清理旧文件...');
  const oldFiles = await storage.listFiles({});
  for (const key of oldFiles.keys) {
    await storage.deleteFile({ fileKey: key });
    console.log(`  ✅ 已删除: ${key}`);
  }

  // 上传新zip文件
  console.log('\n📤 上传zip文件...');
  const file = fs.readFileSync('/tmp/yuxuan-code.zip');
  const key = await storage.uploadFile({
    fileContent: file,
    fileName: 'yuxuan-code.zip',
    contentType: 'application/zip',
  });
  
  // 生成下载链接
  const url = await storage.generatePresignedUrl({ 
    key, 
    expireTime: 365 * 24 * 60 * 60  // 1年有效
  });

  console.log('\n========================================');
  console.log('✅ 上传完成!');
  console.log('========================================');
  console.log('\n📦 ZIP文件下载链接 (1年有效):\n');
  console.log(url);
  console.log('\n文件大小: 9.6 MB');
}

main().catch(console.error);
