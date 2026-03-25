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

  // 获取刚上传的文件key
  const key = 'yuxuan-code.tar_b997b00d.gz';
  
  // 生成超长有效期链接 (1年)
  const url = await storage.generatePresignedUrl({ 
    key, 
    expireTime: 365 * 24 * 60 * 60  // 1年
  });

  console.log('\n================================================');
  console.log('📦 宇轩百货代码下载链接 (1年有效)');
  console.log('================================================\n');
  console.log(url);
}

main().catch(console.error);
