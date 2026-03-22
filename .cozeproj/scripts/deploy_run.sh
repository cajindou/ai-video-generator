#!/bin/bash
set -Eeuo pipefail

# 设置数据库路径为 /tmp 目录（部署环境可写目录）
export DATABASE_PATH=/tmp/coze-mini-program.db

start_service() {
    cd "${COZE_WORKSPACE_PATH}/server/dist"

    local port="${DEPLOY_RUN_PORT:-3000}"
    echo "Starting Static File Server on port ${port} for deploy..."

    cd "${COZE_WORKSPACE_PATH}/server/dist"
    node ./main.js -p "${port}"
}

echo "Starting HTTP service for deploy..."
start_service
