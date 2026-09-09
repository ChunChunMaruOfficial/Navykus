#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/var/www/Navykus"
BACKUP_DIR="/var/backups/navykus"
HEALTH_URL="http://127.0.0.1:4000/api/health"
PM2_APP="Navykus-api"

# Next.js admin build needs more heap than the default.
export NODE_OPTIONS="--max-old-space-size=3072"

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

echo "==> Building admin panel (Next.js)"
# The admin panel is a SEPARATE Next.js app (admin/.next, gitignored). Without
# this step new admin views/nav links (e.g. "Дерево медиа") never reach prod.
npm run build:admin

echo "==> Restarting admin process"
# The admin runs as its own pm2 app whose name/cwd varies between hosts.
# Discover any pm2 process that looks like a Navykus admin and restart it;
# fall back to common names.
ADMIN_APPS="$(pm2 jlist 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{for(const p of JSON.parse(d)){const nm=(p.name||'').toLowerCase();const cwd=(p.pm2_env&&p.pm2_env.pm_cwd)||'';if(/navykus/i.test(nm+cwd)&&/admin/.test(nm))console.log(p.name)}}catch(e){}})" || true)"

if [ -n "$ADMIN_APPS" ]; then
    for app in $ADMIN_APPS; do
        echo "    pm2 restart $app"
        pm2 restart "$app" --update-env || true
    done
else
    echo "    no admin app discovered; trying known names"
    pm2 restart Navykus-admin --update-env 2>/dev/null \
        || pm2 restart navykus-admin --update-env 2>/dev/null \
        || pm2 start npm --name Navykus-admin -- run start:admin \
        || true
fi

pm2 save || true

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
