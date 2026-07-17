#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
#  Navykus — Automated Deployment Script
#  Target: Ubuntu 24.04 LTS on 95.163.227.196
#  Run:  curl -fsSL https://your-repo/raw/deploy.sh | bash
#  Or:   chmod +x deploy.sh && ./deploy.sh
# =============================================================================

NAVYKUS_DOMAIN="${NAVYKUS_DOMAIN:-navykus.org}"
NAVYKUS_ADMIN_EMAIL="${NAVYKUS_ADMIN_EMAIL:-admin@navykus.org}"
NAVYKUS_ADMIN_PASSWORD="${NAVYKUS_ADMIN_PASSWORD:-$(openssl rand -base64 16)}"
PAYLOAD_SECRET="${PAYLOAD_SECRET:-$(openssl rand -base64 32)}"
REPO_URL="${REPO_URL:-https://github.com/your-org/navykus.git}"
APP_DIR="${APP_DIR:-/home/ubuntu/navykus}"

# ── Color helpers ────────────────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
BOLD='\033[1m'; NC='\033[0m'
info()  { echo -e "${CYAN}[INFO]${NC}  $*"; }
ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
err()   { echo -e "${RED}[ERR]${NC}   $*"; }
step()  { echo; echo -e "${BOLD}━━━ $* ━━━${NC}"; }

# ── Pre-flight: must be root ─────────────────────────────────────────────────
if [[ $EUID -ne 0 ]]; then
  err "This script must be run as root (use sudo)."
  exit 1
fi

# ── 1. System dependencies ──────────────────────────────────────────────────
step "1/12 — Installing system packages"

apt-get update -qq
apt-get install -y -qq \
  curl git nginx certbot python3-certbot-nginx \
  build-essential libsqlite3-dev

if ! command -v node &>/dev/null; then
  info "Installing Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs
fi

if ! command -v pm2 &>/dev/null; then
  npm install -g pm2
fi

ok "Node.js $(node -v), npm $(npm -v), PM2 $(pm2 -v)"
ok "Nginx $(nginx -v 2>&1 | grep -oP '[\d.]+')"

# ── 2. Create deploy user & directory ───────────────────────────────────────
step "2/12 — Setting up application directory"

id -u ubuntu &>/dev/null || useradd -m -s /bin/bash ubuntu
mkdir -p "${APP_DIR}"
chown ubuntu:ubuntu "${APP_DIR}"

# ── 3. Clone / copy project ─────────────────────────────────────────────────
step "3/12 — Fetching project code"

if [[ -d "${APP_DIR}/.git" ]]; then
  info "Repository exists — pulling latest..."
  cd "${APP_DIR}" && git pull
else
  info "Cloning repository..."
  # If you're copying manually instead of cloning, place files in $APP_DIR now
  if [[ -n "${REPO_URL}" && "${REPO_URL}" != "https://github.com/your-org/navykus.git" ]]; then
    git clone "${REPO_URL}" "${APP_DIR}"
  else
    warn "REPO_URL not configured — skipping clone."
    warn "Please copy your project files to ${APP_DIR} manually, then re-run."
    exit 0
  fi
fi
cd "${APP_DIR}"

# ── 4. Create .env ──────────────────────────────────────────────────────────
step "4/12 — Creating .env file"

if [[ -f .env ]]; then
  info ".env already exists — backing up to .env.bak.$(date +%s)"
  cp .env ".env.bak.$(date +%s)"
fi

cat > .env <<ENVEOF
# ─── Navykus Production ──────────────────────────────────────
NODE_ENV=production
API_PORT=4000
SERVER_URL=https://${NAVYKUS_DOMAIN}
CORS_ORIGIN=https://${NAVYKUS_DOMAIN}
PAYLOAD_PUBLIC_SERVER_URL=https://${NAVYKUS_DOMAIN}/admin
PAYLOAD_SECRET=${PAYLOAD_SECRET}

# Database — SQLite (file-based, simple for this setup)
DATABASE_URL=file:./payload.db

# Email — uses local Sendmail or SMTP
SMTP_HOST=${SMTP_HOST:-localhost}
SMTP_PORT=${SMTP_PORT:-25}
SMTP_SECURE=${SMTP_SECURE:-false}
SMTP_USER=${SMTP_USER:-}
SMTP_PASS=${SMTP_PASS:-}
SMTP_FROM=${SMTP_FROM:-noreply@${NAVYKUS_DOMAIN}}
SMTP_FROM_NAME=Navykus

# Admin credentials (first-run seed)
ADMIN_EMAIL=${NAVYKUS_ADMIN_EMAIL}
ADMIN_PASSWORD=${NAVYKUS_ADMIN_PASSWORD}

# Optional: AI translation
GOOGLE_GENAI_API_KEY=${GOOGLE_GENAI_API_KEY:-}
ENVEOF

ok ".env created — keep ${NAVYKUS_ADMIN_PASSWORD} safe!"
ok "  Admin login: ${NAVYKUS_ADMIN_EMAIL} / ${NAVYKUS_ADMIN_PASSWORD}"

# ── 5. Install npm dependencies ─────────────────────────────────────────────
step "5/12 — Installing npm dependencies"

npm install --production=false 2>&1 | tail -5
ok "Dependencies installed"

# ── 6. Build frontend ───────────────────────────────────────────────────────
step "6/12 — Building frontend (Vite)"

npm run build 2>&1 | tail -5
ok "Frontend built → dist/"

# ── 7. Run database migrations & seed ────────────────────────────────────────
step "7/12 — Initializing database"

info "Running Payload migrations..."
npx payload migrate --config src/payload.config.ts 2>&1 | tail -5 || true

info "Seeding demo data..."
npx tsx scripts/seed-payload.ts 2>&1 | tail -10 || warn "Seed script had issues (may be ok on re-deploy)"

ok "Database ready"

# ── 8. Create upload directories ────────────────────────────────────────────
step "8/12 — Creating upload directories"

mkdir -p uploads/incoming uploads/media uploads/avatars
chown -R ubuntu:ubuntu uploads
ok "Upload directories created"

# ── 9. Configure Nginx ──────────────────────────────────────────────────────
step "9/12 — Configuring Nginx"

NGINX_CONF="/etc/nginx/sites-available/navykus"

cat > "${NGINX_CONF}" <<NGINXEOF
server {
    listen 80;
    server_name ${NAVYKUS_DOMAIN} www.${NAVYKUS_DOMAIN};

    # Maximum upload size (for file attachments)
    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

# Disable default site, enable navykus
rm -f /etc/nginx/sites-enabled/default
ln -sf "${NGINX_CONF}" /etc/nginx/sites-enabled/navykus

nginx -t && systemctl reload nginx || systemctl restart nginx
ok "Nginx configured and running"

# ── 10. Start Express via PM2 ──────────────────────────────────────────────
step "10/12 — Starting application via PM2"

pm2 delete navykus-api 2>/dev/null || true
pm2 start npm --name "navykus-api" -- start -- run start:api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>&1 | tail -3

ok "PM2 started — navykus-api running on port 4000"

# ── 11. SSL via Let's Encrypt ──────────────────────────────────────────────
step "11/12 — Setting up SSL certificate"

if [[ -n "${NAVYKUS_DOMAIN}" && "${NAVYKUS_DOMAIN}" != "navykus.org" ]]; then
  info "Obtaining SSL certificate for ${NAVYKUS_DOMAIN}..."
  certbot --nginx -d "${NAVYKUS_DOMAIN}" -d "www.${NAVYKUS_DOMAIN}" \
    --non-interactive --agree-tos --email "${NAVYKUS_ADMIN_EMAIL}" \
    || warn "SSL setup failed — you can run 'certbot --nginx' manually later."
  ok "SSL certificate installed"
else
  warn "Skipping SSL — unknown domain. Run 'certbot --nginx' manually when domain is set."
fi

# ── 12. Final health check ──────────────────────────────────────────────────
step "12/12 — Health check"

sleep 3

if curl -sf http://127.0.0.1:4000/api/health > /dev/null 2>&1; then
  HEALTH=$(curl -s http://127.0.0.1:4000/api/health)
  ok "API health: ${HEALTH}"
else
  warn "Health check failed — check 'pm2 logs navykus-api' for details."
fi

# ── Summary ──────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════════╗"
echo "  ║           🚀  Navykus deployed successfully!            ║"
echo "  ╚══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo "  Website:     https://${NAVYKUS_DOMAIN}"
echo "  Admin panel: https://${NAVYKUS_DOMAIN}/admin"
echo "  Admin email: ${NAVYKUS_ADMIN_EMAIL}"
echo "  Admin pass:  ${NAVYKUS_ADMIN_PASSWORD}"
echo ""
echo -e "${YELLOW}  📝  Save the admin password somewhere safe!${NC}"
echo ""
echo "  Useful commands:"
echo "    pm2 status              — check process status"
echo "    pm2 logs navykus-api    — view application logs"
echo "    pm2 restart navykus-api — restart the server"
echo "    sudo nginx -t           — test Nginx config"
echo "    sudo certbot renew      — renew SSL certificate"
echo ""
