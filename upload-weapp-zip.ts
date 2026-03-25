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

  const fileName = "yuxuan-weapp.zip";
  const fileContent = readFileSync(fileName);

  console.log("正在上传小程序代码包...");
  console.log("文件大小:", (fileContent.length / 1024 / 1024).toFixed(2), "MB");

  const key = await storage.uploadFile({
    fileContent,
    fileName,
    contentType: "application/zip",
  });

  console.log("上传成功! Key:", key);

  const url = await storage.generatePresignedUrl({
    key,
    expireTime: 7 * 24 * 60 * 60,
  });

  console.log("\n========================================");
  console.log("小程序代码包下载链接（7天有效）:");
  console.log(url);
  console.log("========================================\n");
}

main().catch(console.error);
