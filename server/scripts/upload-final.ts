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

  // 上传代码
  const file = fs.readFileSync('/tmp/yuxuan-code.tar.gz');
  const key = await storage.uploadFile({
    fileContent: file,
    fileName: 'yuxuan-code.tar.gz',
    contentType: 'application/gzip',
  });
  const url = await storage.generatePresignedUrl({ key, expireTime: 86400 * 30 });

  console.log('\n========================================');
  console.log('📦 宇轩百货 - 代码下载链接');
  console.log('========================================\n');
  console.log(url);
  console.log('\n文件大小: 9.5 MB');
  console.log('有效期: 30天');
}

main().catch(console.error);
