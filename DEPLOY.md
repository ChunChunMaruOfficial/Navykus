# рџљЂ Р”РµРїР»РѕР№ Navykus РЅР° СЃРµСЂРІРµСЂ

**РЎРµСЂРІРµСЂ:** `95.163.227.196`  
**РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ:** `root`  
**РћРЎ:** Ubuntu 24.04 LTS

---

## Р’Р°СЂРёР°РЅС‚ 1: РђРІС‚РѕРјР°С‚РёС‡РµСЃРєРёР№ СЃРєСЂРёРїС‚ (СЂРµРєРѕРјРµРЅРґСѓРµС‚СЃСЏ)

РЎРєРѕРїРёСЂСѓР№С‚Рµ `deploy.sh` РЅР° СЃРµСЂРІРµСЂ Рё Р·Р°РїСѓСЃС‚РёС‚Рµ:

```bash
# 1. РЎРєРѕРїРёСЂРѕРІР°С‚СЊ СЃРєСЂРёРїС‚ РЅР° СЃРµСЂРІРµСЂ
scp deploy.sh root@95.163.227.196:/root/deploy.sh

# 2. Р—Р°Р№С‚Рё РЅР° СЃРµСЂРІРµСЂ
ssh root@95.163.227.196

# 3. РќР°СЃС‚СЂРѕРёС‚СЊ РїРµСЂРµРјРµРЅРЅС‹Рµ (Р·Р°РјРµРЅРёС‚Рµ РЅР° СЃРІРѕРё)
export NAVYKUS_DOMAIN="navykus.online"
export NAVYKUS_ADMIN_EMAIL="admin@navykus.online"
export REPO_URL="https://github.com/your-org/navykus.git"  # РёР»Рё РєРѕРїРёСЂСѓР№С‚Рµ РІСЂСѓС‡РЅСѓСЋ

# 4. Р—Р°РїСѓСЃС‚РёС‚СЊ
chmod +x deploy.sh
./deploy.sh
```

**Р•СЃР»Рё РЅРµС‚ Git-СЂРµРїРѕР·РёС‚РѕСЂРёСЏ** вЂ” Р·Р°РіСЂСѓР·РёС‚Рµ РїСЂРѕРµРєС‚ РІСЂСѓС‡РЅСѓСЋ С‡РµСЂРµР· SCP РїРµСЂРµРґ Р·Р°РїСѓСЃРєРѕРј:

```bash
# РќР° Р»РѕРєР°Р»СЊРЅРѕР№ РјР°С€РёРЅРµ (Windows):
# РЎРѕР±СЂР°С‚СЊ С„СЂРѕРЅС‚РµРЅРґ
cd D:\Navykus
npm run build

# РЎРѕР·РґР°С‚СЊ Р°СЂС…РёРІ СЃ РїСЂРѕРµРєС‚РѕРј (РёСЃРєР»СЋС‡Р°СЏ node_modules)
tar --exclude=node_modules -czf navykus.tar.gz .

# РќР° СЃРµСЂРІРµСЂРµ
scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/navykus.tar.gz
ssh root@95.163.227.196
cd /home/ubuntu
tar -xzf navykus.tar.gz -C navykus
chown -R ubuntu:ubuntu navykus
```

---

## Р’Р°СЂРёР°РЅС‚ 2: Р СѓС‡РЅРѕР№ РґРµРїР»РѕР№ (РїРѕС€Р°РіРѕРІРѕ)

### РЁР°Рі 1. РџРѕРґРєР»СЋС‡РµРЅРёРµ Рє СЃРµСЂРІРµСЂСѓ

```bash
ssh root@95.163.227.196
```

### РЁР°Рі 2. РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№

```bash
# РћР±РЅРѕРІР»РµРЅРёРµ РїР°РєРµС‚РѕРІ
apt-get update && apt-get upgrade -y

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx build-essential

# PM2
npm install -g pm2

# РџСЂРѕРІРµСЂРєР°
node -v   # >= 22
npm -v
nginx -v
```

### РЁР°Рі 3. РљРѕРїРёСЂРѕРІР°РЅРёРµ РїСЂРѕРµРєС‚Р°

**РќР° Р»РѕРєР°Р»СЊРЅРѕР№ РјР°С€РёРЅРµ (Windows PowerShell):**
```powershell
# РЎРѕР±СЂР°С‚СЊ С„СЂРѕРЅС‚РµРЅРґ
cd D:\Navykus
npm run build

# РЈСЃС‚Р°РЅРѕРІРёС‚СЊ OpenSSH (РµСЃР»Рё РЅРµС‚) РёР»Рё РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ WinSCP
# РЎРѕР·РґР°С‚СЊ Р°СЂС…РёРІ
tar -czf navykus.tar.gz --exclude=node_modules --exclude=.git .
```

**РќР° СЃРµСЂРІРµСЂРµ:**
```bash
# РЎРѕР·РґР°С‚СЊ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ Рё РїР°РїРєСѓ
useradd -m -s /bin/bash ubuntu || true
mkdir -p /home/ubuntu/navykus

# РЎРєРѕРїРёСЂРѕРІР°С‚СЊ Р°СЂС…РёРІ (СЃ Р»РѕРєР°Р»СЊРЅРѕР№ РјР°С€РёРЅС‹)
# scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/

# Р Р°СЃРїР°РєРѕРІР°С‚СЊ
cd /home/ubuntu
tar -xzf navykus.tar.gz -C navykus
chown -R ubuntu:ubuntu navykus
cd navykus
```

### РЁР°Рі 4. РќР°СЃС‚СЂРѕР№РєР° РѕРєСЂСѓР¶РµРЅРёСЏ

```bash
cd /home/ubuntu/navykus

# РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ СЃРµРєСЂРµС‚С‹
PAYLOAD_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 16)

# РЎРѕР·РґР°С‚СЊ .env
cat > .env <<EOF
NODE_ENV=production
API_PORT=4000
SERVER_URL=https://navykus.online
CORS_ORIGIN=https://navykus.online
PAYLOAD_PUBLIC_SERVER_URL=https://navykus.online/admin
PAYLOAD_SECRET=${PAYLOAD_SECRET}
DATABASE_URL=file:./payload.db
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@navykus.online
SMTP_FROM_NAME=Navykus
ADMIN_EMAIL=admin@navykus.online
ADMIN_PASSWORD=${ADMIN_PASSWORD}
GOOGLE_GENAI_API_KEY=
EOF

echo "Admin password: ${ADMIN_PASSWORD}"  # РЎРѕС…СЂР°РЅРёС‚Рµ!
```

### РЁР°Рі 5. РЈСЃС‚Р°РЅРѕРІРєР° Р·Р°РІРёСЃРёРјРѕСЃС‚РµР№ Рё СЃР±РѕСЂРєР°

```bash
cd /home/ubuntu/navykus
npm install --production=false
npm run build
```

### РЁР°Рі 6. РњРёРіСЂР°С†РёСЏ Рё РЅР°РїРѕР»РЅРµРЅРёРµ Р‘Р”

```bash
cd /home/ubuntu/navykus

# РњРёРіСЂР°С†РёРё
npx payload migrate --config src/payload.config.ts

# РќР°РїРѕР»РЅРµРЅРёРµ РґРµРјРѕ-РґР°РЅРЅС‹РјРё
npx tsx scripts/seed-payload.ts
```

### РЁР°Рі 7. РЎРѕР·РґР°РЅРёРµ РїР°РїРѕРє РґР»СЏ Р·Р°РіСЂСѓР·РѕРє

```bash
cd /home/ubuntu/navykus
mkdir -p uploads/incoming uploads/media uploads/avatars
chown -R ubuntu:ubuntu uploads
```

### РЁР°Рі 8. РќР°СЃС‚СЂРѕР№РєР° Nginx

```bash
cat > /etc/nginx/sites-available/navykus <<'NGINXEOF'
server {
    listen 80;
    server_name navykus.online www.navykus.online;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINXEOF

# РђРєС‚РёРІРёСЂРѕРІР°С‚СЊ РєРѕРЅС„РёРі
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/navykus /etc/nginx/sites-enabled/

# РџСЂРѕРІРµСЂРёС‚СЊ Рё РїРµСЂРµР·Р°РіСЂСѓР·РёС‚СЊ
nginx -t
systemctl reload nginx
```

### РЁР°Рі 9. Р—Р°РїСѓСЃРє С‡РµСЂРµР· PM2

```bash
cd /home/ubuntu/navykus
pm2 start npm --name "navykus-api" -- start -- run start:api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Р’С‹РїРѕР»РЅРёС‚СЊ РєРѕРјР°РЅРґСѓ, РєРѕС‚РѕСЂСѓСЋ РІС‹РІРµРґРµС‚ pm2 startup
```

### РЁР°Рі 10. SSL-СЃРµСЂС‚РёС„РёРєР°С‚ (Let's Encrypt)

```bash
certbot --nginx -d navykus.online -d www.navykus.online \
  --non-interactive --agree-tos --email admin@navykus.online
```

### РЁР°Рі 11. РџСЂРѕРІРµСЂРєР°

```bash
curl -s http://127.0.0.1:4000/api/health
# Р”РѕР»Р¶РµРЅ РѕС‚РІРµС‚РёС‚СЊ: {"ok":true,"service":"navykus-express-payload","db":"connected"}
```

---

## рџ”§ РџРѕР»РµР·РЅС‹Рµ РєРѕРјР°РЅРґС‹

| РљРѕРјР°РЅРґР° | РћРїРёСЃР°РЅРёРµ |
|---|---|
| `pm2 status` | РЎС‚Р°С‚СѓСЃ РїСЂРѕС†РµСЃСЃРѕРІ |
| `pm2 logs navykus-api` | Р›РѕРіРё РїСЂРёР»РѕР¶РµРЅРёСЏ |
| `pm2 restart navykus-api` | РџРµСЂРµР·Р°РїСѓСЃРє |
| `pm2 monit` | РњРѕРЅРёС‚РѕСЂРёРЅРі РІ СЂРµР°Р»СЊРЅРѕРј РІСЂРµРјРµРЅРё |
| `sudo nginx -t` | РџСЂРѕРІРµСЂРєР° РєРѕРЅС„РёРіР° Nginx |
| `sudo systemctl reload nginx` | РџРµСЂРµР·Р°РіСЂСѓР·РєР° Nginx |
| `sudo certbot renew` | РћР±РЅРѕРІР»РµРЅРёРµ SSL (Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РєР°Р¶РґС‹Р№ РјРµСЃСЏС†) |
| `journalctl -u nginx -f` | Р›РѕРіРё Nginx |

## рџ”„ РћР±РЅРѕРІР»РµРЅРёРµ РїСЂРѕРµРєС‚Р°

```bash
cd /home/ubuntu/navykus

# Р•СЃР»Рё С‡РµСЂРµР· Git
git pull

# Р•СЃР»Рё РІСЂСѓС‡РЅСѓСЋ вЂ” РїРµСЂРµР·Р°Р»РµР№С‚Рµ Р°СЂС…РёРІ Рё СЂР°СЃРїР°РєСѓР№С‚Рµ
# scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/

npm install
npm run build
npx payload migrate --config src/payload.config.ts
pm2 restart navykus-api
```

## рџђ› Р РµС€РµРЅРёРµ РїСЂРѕР±Р»РµРј

**502 Bad Gateway** вЂ” Express РЅРµ Р·Р°РїСѓС‰РµРЅ:
```bash
pm2 start navykus-api
```

**Cannot find module** вЂ” РЅРµ СѓСЃС‚Р°РЅРѕРІР»РµРЅС‹ Р·Р°РІРёСЃРёРјРѕСЃС‚Рё:
```bash
cd /home/ubuntu/navykus && npm install
```

**Permission denied** вЂ” РЅРµРїСЂР°РІРёР»СЊРЅС‹Рµ РїСЂР°РІР°:
```bash
chown -R ubuntu:ubuntu /home/ubuntu/navykus
chown -R ubuntu:ubuntu /home/ubuntu/navykus/uploads
chmod 755 /home/ubuntu/navykus/payload.db
```

**Cannot write to database** вЂ” SQLite С„Р°Р№Р» Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅ:
```bash
chmod 666 /home/ubuntu/navykus/payload.db
```
