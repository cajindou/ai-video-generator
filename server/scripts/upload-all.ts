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

  // 上传所有代码
  const file = fs.readFileSync('/tmp/all-code-20260325234436.tar.gz');
  const key = await storage.uploadFile({
    fileContent: file,
    fileName: 'downloads/yuxuan-all-code.tar.gz',
    contentType: 'application/gzip',
  });
  const url = await storage.generatePresignedUrl({ key, expireTime: 86400 * 30 });

  console.log('\n========================================');
  console.log('📦 宇轩百货 - 全部代码下载链接 (30天有效):');
  console.log('========================================\n');
  console.log(url);
  console.log('\n文件大小: 13 MB');
}

main().catch(console.error);
