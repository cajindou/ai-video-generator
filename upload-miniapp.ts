import { S3Storage } from "coze-coding-dev-sdk";
import { readFileSync } from "fs";

async function main() {
  const storage = new S3Storage({
    endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
    accessKey: "",
    secretKey: "",
    bucketName: process.env.COZE_BUCKET_NAME,
    region: "cn-beijing",
  });

  // 读取打包好的小程序文件
  const fileBuffer = readFileSync("/workspace/projects/yuxuan-miniapp-weapp.tar.gz");
  
  // 上传文件
  const key = await storage.uploadFile({
    fileContent: fileBuffer,
    fileName: "yuxuan-miniapp-weapp.tar.gz",
    contentType: "application/gzip",
  });
  
  console.log("上传成功，key:", key);
  
  // 生成7天有效期的下载链接
  const downloadUrl = await storage.generatePresignedUrl({
    key,
    expireTime: 604800, // 7天
  });
  
  console.log("下载链接:", downloadUrl);
}

main().catch(console.error);
