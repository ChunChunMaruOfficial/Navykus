#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/var/www/Navykus"
BACKUP_DIR="/var/backups/navykus"
HEALTH_URL="http://127.0.0.1:4000/api/health"
PM2_APP="Navykus-api"

cd "$APP_DIR"

echo "==> Deployment started: $(date)"

echo "==> Creating database backup"
mkdir -p "$BACKUP_DIR"

if [ -f payload.db ]; then
    cp payload.db "$BACKUP_DIR/payload-$(date +%Y%m%d-%H%M%S).db"
fi

echo "==> Installing dependencies"
npm ci

echo "==> Building frontend"
npm run build

echo "==> Restarting application"
pm2 restart "$PM2_APP" --update-env

echo "==> Waiting for application"
sleep 5

echo "==> Health check"
HEALTH="$(curl -fsS "$HEALTH_URL")"

echo "$HEALTH"

if ! echo "$HEALTH" | grep -q '"ok":true'; then
    echo "ERROR: health check failed"
    exit 1
fi

echo "==> Deployment successful: $(date)"
