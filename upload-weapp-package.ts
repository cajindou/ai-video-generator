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

  // 读取打包好的小程序代码
  const fileName = "yuxuan-weapp-202603260026.tar.gz";
  const fileContent = readFileSync(fileName);

  console.log("正在上传小程序代码包...");
  console.log("文件大小:", (fileContent.length / 1024 / 1024).toFixed(2), "MB");

  // 上传文件
  const key = await storage.uploadFile({
    fileContent,
    fileName,
    contentType: "application/gzip",
  });

  console.log("上传成功! Key:", key);

  // 生成签名 URL（有效期 7 天）
  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60, // 7 天
  });

  console.log("\n========================================");
  console.log("小程序代码包下载链接（7天有效）:");
  console.log(url);
  console.log("========================================\n");
}

main().catch(console.error);
