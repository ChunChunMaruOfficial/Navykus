#!/usr/bin/env bash

set -Eeuo pipefail

APP_DIR="/var/www/Navykus"
BACKUP_DIR="/var/backups/navykus"
HEALTH_URL="http://127.0.0.1:4000/api/health"
PM2_APP="Navykus-api"

# --- toolchain resolution -------------------------------------------------
# GitHub Actions runs this over a non-interactive SSH session, which gets a
# minimal PATH and does NOT source ~/.bashrc / ~/.profile / nvm. Make sure
# node / npm / pm2 resolve regardless of how Node was installed.
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$HOME/.local/bin:$PATH"
if [ -s "$HOME/.nvm/nvm.sh" ]; then . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1 || true; fi
for d in /root/.nvm/versions/node/*/bin /usr/local/lib/nodejs/*/bin; do
    [ -d "$d" ] && export PATH="$d:$PATH"
done

for tool in node npm pm2; do
    command -v "$tool" >/dev/null 2>&1 || {
        echo "ERROR: '$tool' not found. PATH=$PATH"
        exit 1
    }
done

# Next.js admin build needs more heap than the default.
export NODE_OPTIONS="--max-old-space-size=3072"

cd "$APP_DIR"

echo "==> Deployment started: $(date)"
echo "    node $(node -v) | npm $(npm -v) | $(pm2 -v)"

echo "==> Creating database backup"
mkdir -p "$BACKUP_DIR"
if [ -f payload.db ]; then
    cp payload.db "$BACKUP_DIR/payload-$(date +%Y%m%d-%H%M%S).db"
    ls -1t "$BACKUP_DIR"/payload-*.db 2>/dev/null | tail -n +15 | xargs -r rm -f
fi

echo "==> Installing dependencies"
npm ci --no-audit --no-fund

echo "==> Building frontend (Vite)"
npm run build

echo "==> Building admin panel (Next.js)"
# The admin panel is a SEPARATE Next.js app (admin/.next, gitignored). Without
# this step new admin views / nav links (e.g. "Дерево медиа") never reach prod.
npm run build:admin

echo "==> Restarting admin process"
# The admin runs as its own pm2 app; discover it by name so a host rename
# does not silently skip the restart. Falls back to known names.
ADMIN_APPS="$(pm2 jlist 2>/dev/null | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>{try{for(const p of JSON.parse(d)){const nm=(p.name||'');const cwd=(p.pm2_env&&p.pm2_env.pm_cwd)||'';if(/navykus/i.test(nm+cwd)&&/admin/i.test(nm))console.log(nm)}}catch(e){}})" || true)"

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

echo "==> Restarting API"
pm2 restart "$PM2_APP" --update-env || pm2 start npm --name "$PM2_APP" -- run start:api

pm2 save || true

echo "==> Health check"
HEALTH=""
for _ in $(seq 1 12); do
    HEALTH="$(curl -fsS --max-time 5 "$HEALTH_URL" || true)"
    echo "$HEALTH" | grep -q '"ok":true' && break
    sleep 3
done

echo "$HEALTH"
echo "$HEALTH" | grep -q '"ok":true' || {
    echo "ERROR: health check failed"
    exit 1
}

echo "==> Deployment successful: $(date)"
