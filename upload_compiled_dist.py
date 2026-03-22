#!/usr/bin/env python3
import os
import paramiko
import sys

# 服务器配置
SERVER_HOST = '47.238.239.28'
SERVER_USER = 'root'
SERVER_PORT = 22
SERVER_PASSWORD = 'j021990J@'

# 本地文件路径
LOCAL_FILE = '/workspace/projects/compiled-dist.tar.gz'
REMOTE_DIR = '/root/ai-video-generator'
REMOTE_FILE = f'{REMOTE_DIR}/server/dist.tar.gz'

# SSH 连接
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(SERVER_HOST, port=SERVER_PORT, username=SERVER_USER, password=SERVER_PASSWORD)

try:
    # 创建 SFTP 客户端
    sftp = ssh.open_sftp()

    # 上传文件
    print(f'开始上传文件: {LOCAL_FILE}')
    sftp.put(LOCAL_FILE, REMOTE_FILE)
    print(f'文件上传成功: {REMOTE_FILE}')

    sftp.close()

    # 解压文件
    stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_DIR} && rm -rf server/dist.bak 2>/dev/null; mv server/dist server/dist.bak 2>/dev/null; mkdir -p server/dist && tar -xzf server/dist.tar.gz -C server/dist && rm server/dist.tar.gz')
    print('解压文件...')
    stdout.read()
    print('解压完成')

    # 重启容器
    print('重启容器...')
    stdin, stdout, stderr = ssh.exec_command(f'cd {REMOTE_DIR} && docker compose up -d --force-recreate')
    stdout.read()
    print('容器重启完成')

finally:
    ssh.close()
    print('操作完成')
