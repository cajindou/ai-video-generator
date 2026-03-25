import { S3Storage } from 'coze-coding-dev-sdk';

async function cleanAndUpload() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: '',
    secretKey: '',
    bucketName: process.env.COZE_BUCKET_NAME,
    region: 'cn-beijing',
  });

  // 列出所有文件
  console.log('📋 正在查找所有文件...\n');
  const result = await storage.listFiles({ prefix: '', maxKeys: 1000 });
  
  console.log(`找到 ${result.keys.length} 个文件:\n`);
  result.keys.forEach(key => console.log(`  - ${key}`));

  // 删除所有文件
  console.log('\n🗑️ 正在删除所有文件...\n');
  for (const key of result.keys) {
    await storage.deleteFile({ fileKey: key });
    console.log(`  ✅ 已删除: ${key}`);
  }

  console.log('\n✨ 清理完成!\n');
}

cleanAndUpload().catch(console.error);
