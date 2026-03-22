#!/usr/bin/env python3
"""
修复 Docker 容器内的 video.service.js 文件
将 .inputFormat('lavfi') 替换为 .inputOptions(['-f lavfi'])

使用方法：
1. 将此脚本上传到服务器
2. 执行: python3 fix_ffmpeg.py
"""

import subprocess
import sys

# 容器名称
CONTAINER_NAME = "ai-video-generator"
# 容器内文件路径
CONTAINER_FILE_PATH = "/app/server/dist/video/video.service.js"

def run_docker_command(cmd):
    """执行 docker 命令"""
    result = subprocess.run(
        f"docker exec {CONTAINER_NAME} {cmd}",
        shell=True,
        capture_output=True,
        text=True
    )
    return result.stdout, result.stderr, result.returncode

def main():
    print("=" * 50)
    print("开始修复 FFmpeg 参数...")
    print("=" * 50)

    # 1. 检查容器是否运行
    print("\n[1/5] 检查容器状态...")
    result = subprocess.run(
        f"docker ps --filter name={CONTAINER_NAME} --format '{{{{.Names}}}}'",
        shell=True,
        capture_output=True,
        text=True
    )
    if CONTAINER_NAME not in result.stdout:
        print(f"错误: 容器 {CONTAINER_NAME} 未运行")
        sys.exit(1)
    print(f"✓ 容器 {CONTAINER_NAME} 正在运行")

    # 2. 从容器复制文件到临时位置
    print("\n[2/5] 从容器复制文件...")
    result = subprocess.run(
        f"docker cp {CONTAINER_NAME}:{CONTAINER_FILE_PATH} /tmp/video.service.js",
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"错误: 复制文件失败 - {result.stderr}")
        sys.exit(1)
    print("✓ 文件已复制到 /tmp/video.service.js")

    # 3. 读取并修复文件
    print("\n[3/5] 修复 FFmpeg 参数...")
    with open("/tmp/video.service.js", "r", encoding="utf-8") as f:
        content = f.read()

    original_content = content

    # 修复第一处: 多图轮播视频生成
    old1 = ".input('anullsrc=channel_layout=stereo:sample_rate=44100')\n                .inputFormat('lavfi')"
    new1 = ".input('anullsrc=channel_layout=stereo:sample_rate=44100')\n                .inputOptions(['-f lavfi'])"
    content = content.replace(old1, new1)

    # 修复第二处: 单图视频生成
    old2 = ".input('anullsrc=channel_layout=stereo:sample_rate=44100')\n                .inputFormat('lavfi')"
    new2 = ".input('anullsrc=channel_layout=stereo:sample_rate=44100')\n                .inputOptions(['-f lavfi'])"
    content = content.replace(old2, new2)

    if content == original_content:
        # 检查是否已经修复
        if ".inputOptions(['-f lavfi'])" in content:
            print("✓ 文件已经是修复后的版本，无需修改")
        else:
            print("警告: 未找到需要修复的内容，请检查文件格式")
    else:
        with open("/tmp/video.service.js", "w", encoding="utf-8") as f:
            f.write(content)
        print("✓ 文件已修复")

    # 4. 复制修复后的文件回容器
    print("\n[4/5] 复制修复后的文件到容器...")
    result = subprocess.run(
        f"docker cp /tmp/video.service.js {CONTAINER_NAME}:{CONTAINER_FILE_PATH}",
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"错误: 复制文件到容器失败 - {result.stderr}")
        sys.exit(1)
    print("✓ 文件已复制到容器")

    # 5. 重启容器
    print("\n[5/5] 重启容器...")
    result = subprocess.run(
        f"docker restart {CONTAINER_NAME}",
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"错误: 重启容器失败 - {result.stderr}")
        sys.exit(1)
    print("✓ 容器已重启")

    # 等待容器启动
    import time
    print("\n等待容器启动...")
    time.sleep(5)

    # 检查容器状态
    result = subprocess.run(
        f"docker ps --filter name={CONTAINER_NAME} --format '{{{{.Status}}}}'",
        shell=True,
        capture_output=True,
        text=True
    )
    print(f"容器状态: {result.stdout.strip()}")

    print("\n" + "=" * 50)
    print("修复完成!")
    print("=" * 50)
    print("\n测试命令:")
    print("docker logs --tail 50 ai-video-generator")

if __name__ == "__main__":
    main()
