/**
 * 视频生成测试脚本
 * 测试 FFmpeg 多图轮播视频生成
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import axios from 'axios';

// 图片URL列表
const imageUrls = [
  'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F2da27abc327ec927ff12de0a64891d41.jpg&nonce=00f66c0e-9840-43a9-983d-a565829650b9&project_id=7612318003925139494&sign=68bd6714722c8c756f1b40da27468b6ae93f5756577bc8e72094437d07e7eed6',
  'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F9a3a1d1b5f2b699520c3d9b96c0be565.jpg&nonce=2b1a0f59-0546-4ca4-8b19-b13db4fbc966&project_id=7612318003925139494&sign=5f0a9f19fe2d69f0bfd509371133adaa64ebe4109b5c42f343730de791a96813',
  'https://code.coze.cn/api/sandbox/coze_coding/file/proxy?expire_time=-1&file_path=assets%2F54b529829802ff9a44defbd4ce94d0c2.jpg&nonce=4ebe7a7a-aca0-47af-904e-d77920c60337&project_id=7612318003925139494&sign=bed2e0dbb1f1126dd6cb14895efe69a858ed48aa47e38abf457b127aed598a91'
];

// 测试文案
const copywriting = '这家店太绝了！早上9点就排起了长队，就为这一口刚出炉的美味。我已经连续三天来打卡了，他们的招牌产品真的绝了，现点现做，香气扑鼻，每一口都能感受到匠心。性价比超高，强烈推荐！';

/**
 * 下载图片
 */
async function downloadImage(url: string, outputPath: string): Promise<void> {
  console.log(`下载图片: ${url.substring(0, 80)}...`);
  const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 30000 });
  fs.writeFileSync(outputPath, Buffer.from(response.data));
  console.log(`图片已保存: ${outputPath} (${response.data.length} bytes)`);
}

/**
 * 使用 FFmpeg 从多张图片生成视频（简化版本，不使用 xfade）
 */
async function generateVideoFromMultipleImages(imagePaths: string[], outputPath: string, duration: number): Promise<void> {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  const ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log('FFmpeg 路径:', ffmpegPath);
  
  return new Promise((resolve, reject) => {
    console.log('\n=== 开始生成多图轮播视频 ===');
    console.log('图片数量:', imagePaths.length);
    console.log('视频时长:', duration, '秒');
    console.log('输出路径:', outputPath);
    
    const command = ffmpeg();
    
    // 为每张图片创建输入
    imagePaths.forEach((imagePath, index) => {
      command.input(imagePath).inputOptions([
        '-loop 1',
        `-t ${duration / imagePaths.length}`,
        '-framerate 1'
      ]);
    });
    
    // 构建 filter_complex（使用 concat 而不是 xfade）
    const filters: string[] = [];
    
    // 为每个视频添加 scale、pad 和 setsar，并设置帧率
    // setsar=1 确保所有视频的 SAR 一致
    for (let i = 0; i < imagePaths.length; i++) {
      filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p,fps=30[v${i}]`);
    }
    
    // 使用 concat 拼接所有视频（不带转场效果）
    const inputs = imagePaths.map((_, i) => `[v${i}]`).join('');
    filters.push(`${inputs}concat=n=${imagePaths.length}:v=1:a=0[v]`);
    
    // 添加静音音频生成
    filters.push(`anullsrc=r=44100:cl=stereo[a]`);
    
    const filterComplex = filters.join(';');
    console.log('\n=== filter_complex ===');
    console.log(filterComplex);
    
    command
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        '-preset ultrafast',
        '-crf 28',
        '-pix_fmt yuv420p',
        '-movflags +faststart',
        '-filter_complex', filterComplex,
        '-map', '[v]',
        '-map', '[a]'
      ])
      .on('start', (commandLine: string) => {
        console.log('\n=== FFmpeg 命令 ===');
        console.log(commandLine);
      })
      .on('stderr', (stderrLine: string) => {
        console.log('[FFmpeg]', stderrLine);
      })
      .on('end', () => {
        console.log('\n=== 视频生成完成 ===');
        resolve();
      })
      .on('error', (err: Error) => {
        console.error('\n=== FFmpeg 错误 ===');
        console.error(err);
        reject(err);
      })
      .save(outputPath);
  });
}

/**
 * 主函数
 */
async function main() {
  console.log('========================================');
  console.log('视频生成测试');
  console.log('========================================\n');
  
  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `video_test_${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log('临时目录:', tempDir);
  
  try {
    // 下载图片
    console.log('\n=== 下载图片 ===');
    const imagePaths: string[] = [];
    for (let i = 0; i < imageUrls.length; i++) {
      const imagePath = path.join(tempDir, `image_${i}.jpg`);
      await downloadImage(imageUrls[i], imagePath);
      imagePaths.push(imagePath);
    }
    
    // 生成视频
    const videoPath = path.join(tempDir, 'output_video.mp4');
    await generateVideoFromMultipleImages(imagePaths, videoPath, 30);
    
    // 检查视频文件
    const stats = fs.statSync(videoPath);
    console.log('\n=== 视频信息 ===');
    console.log('文件路径:', videoPath);
    console.log('文件大小:', (stats.size / 1024 / 1024).toFixed(2), 'MB');
    
    // 复制到 assets 目录
    const assetsDir = path.join(process.cwd(), 'assets');
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const finalVideoPath = path.join(assetsDir, 'test_video_output.mp4');
    fs.copyFileSync(videoPath, finalVideoPath);
    console.log('视频已复制到:', finalVideoPath);
    
    // 清理临时目录
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('\n临时目录已清理');
    
    console.log('\n========================================');
    console.log('测试完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n=== 测试失败 ===');
    console.error(error);
    throw error;
  }
}

// 运行测试
main().catch(console.error);
