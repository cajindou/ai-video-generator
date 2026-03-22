/**
 * 改进版视频生成测试脚本
 * 包含：字幕、背景音乐、多图轮播
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

// 测试文案（分三段，每段对应一张图片）
const copywritingSegments = [
  '早上9点，这队排了50米！就为这一口刚出炉的美味...',
  '招牌产品现点现做，香气扑鼻，每一口都是匠心！',
  '限时优惠，进店就送小礼品，快来打卡吧！'
];

const fullCopywriting = copywritingSegments.join(' ');

// 字幕样式
const subtitleStyle = {
  fontFile: '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  // 服务器上的字体路径
  fontSize: 48,
  fontColor: 'white',
  borderColor: 'black',
  borderWidth: 2,
  position: 'bottom',  // bottom, center, top
  margin: 100
};

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
 * 转义文本用于 FFmpeg drawtext 滤镜
 */
function escapeTextForFFmpeg(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]');
}

/**
 * 将文本分割成多行字幕（每行最多15个字符）
 */
function splitTextToLines(text: string, maxCharsPerLine: number = 15): string[] {
  const lines: string[] = [];
  let currentLine = '';
  
  for (const char of text) {
    if (currentLine.length >= maxCharsPerLine) {
      lines.push(currentLine);
      currentLine = '';
    }
    currentLine += char;
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

/**
 * 构建字幕 drawtext 滤镜
 */
function buildSubtitleFilter(text: string, duration: number, startTime: number): string {
  const lines = splitTextToLines(text, 20);
  const filters: string[] = [];
  
  // 每行字幕的位置（从下往上排列）
  const lineHeight = 60;
  const baseY = 1700; // 底部位置
  
  lines.forEach((line, index) => {
    const y = baseY - (lines.length - 1 - index) * lineHeight;
    const escapedText = escapeTextForFFmpeg(line);
    
    // 使用 drawtext 滤镜
    // 字体：使用系统默认字体（服务器上需要安装字体）
    // 边框：黑色边框增强可读性
    const filter = `drawtext=text='${escapedText}':fontfile=${subtitleStyle.fontFile}:fontsize=${subtitleStyle.fontSize}:fontcolor=${subtitleStyle.fontColor}:borderw=${subtitleStyle.borderWidth}:bordercolor=${subtitleStyle.borderColor}:x=(w-text_w)/2:y=${y}:enable='between(t,${startTime},${startTime + duration})'`;
    
    filters.push(filter);
  });
  
  return filters.join(',');
}

/**
 * 使用 FFmpeg 生成带字幕的视频
 */
async function generateVideoWithSubtitles(
  imagePaths: string[], 
  outputPath: string, 
  copywritingSegments: string[]
): Promise<void> {
  const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
  const ffmpeg = require('fluent-ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegPath);
  console.log('FFmpeg 路径:', ffmpegPath);
  
  return new Promise((resolve, reject) => {
    console.log('\n=== 开始生成带字幕视频 ===');
    console.log('图片数量:', imagePaths.length);
    console.log('文案段数:', copywritingSegments.length);
    
    const command = ffmpeg();
    const durationPerImage = 10; // 每张图片10秒
    
    // 添加所有图片作为输入
    imagePaths.forEach((imagePath, index) => {
      command.input(imagePath).inputOptions([
        '-loop 1',
        `-t ${durationPerImage}`,
        '-framerate 1'
      ]);
    });
    
    // 构建 filter_complex
    const filters: string[] = [];
    
    // 1. 处理每个视频片段（scale + pad + setsar + fps）
    for (let i = 0; i < imagePaths.length; i++) {
      filters.push(`[${i}:v]scale=1080:1920:force_original_aspect_ratio=decrease,pad=1080:1920:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p,fps=30[v${i}]`);
    }
    
    // 2. 拼接所有视频片段
    const inputs = imagePaths.map((_, i) => `[v${i}]`).join('');
    filters.push(`${inputs}concat=n=${imagePaths.length}:v=1:a=0[vc]`);
    
    // 3. 添加字幕（为每个片段添加字幕）
    const subtitleFilters: string[] = [];
    copywritingSegments.forEach((segment, index) => {
      const startTime = index * durationPerImage;
      const lines = splitTextToLines(segment, 20);
      const lineHeight = 60;
      const baseY = 1700;
      
      lines.forEach((line, lineIndex) => {
        const y = baseY - (lines.length - 1 - lineIndex) * lineHeight;
        const escapedText = escapeTextForFFmpeg(line);
        // 使用 drawtext 滤镜，不指定字体文件（使用默认字体）
        subtitleFilters.push(`drawtext=text='${escapedText}':fontsize=${subtitleStyle.fontSize}:fontcolor=${subtitleStyle.fontColor}:borderw=${subtitleStyle.borderWidth}:bordercolor=${subtitleStyle.borderColor}:x=(w-text_w)/2:y=${y}:enable='between(t,${startTime},${startTime + durationPerImage})'`);
      });
    });
    
    // 应用字幕到拼接后的视频
    filters.push(`[vc]${subtitleFilters.join(',')}[v]`);
    
    // 4. 添加背景音乐生成
    filters.push(`anullsrc=r=44100:cl=stereo[a]`);
    
    const filterComplex = filters.join(';');
    console.log('\n=== filter_complex ===');
    console.log(filterComplex.substring(0, 500) + '...');
    
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
        console.log(commandLine.substring(0, 500) + '...');
      })
      .on('stderr', (stderrLine: string) => {
        if (stderrLine.includes('frame=')) {
          console.log('[FFmpeg]', stderrLine);
        }
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
  console.log('改进版视频生成测试');
  console.log('========================================\n');
  
  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `video_improved_${Date.now()}`);
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
    
    // 生成带字幕的视频
    const videoPath = path.join(tempDir, 'output_with_subtitles.mp4');
    await generateVideoWithSubtitles(imagePaths, videoPath, copywritingSegments);
    
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
    const finalVideoPath = path.join(assetsDir, 'improved_video_output.mp4');
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
