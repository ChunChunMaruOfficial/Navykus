# 🚀 Деплой Navykus на сервер

**Сервер:** `95.163.227.196`  
**Пользователь:** `root`  
**ОС:** Ubuntu 24.04 LTS

---

## Вариант 1: Автоматический скрипт (рекомендуется)

Скопируйте `deploy.sh` на сервер и запустите:

```bash
# 1. Скопировать скрипт на сервер
scp deploy.sh root@95.163.227.196:/root/deploy.sh

# 2. Зайти на сервер
ssh root@95.163.227.196

# 3. Настроить переменные (замените на свои)
export NAVYKUS_DOMAIN="navykus.org"
export NAVYKUS_ADMIN_EMAIL="admin@navykus.org"
export REPO_URL="https://github.com/your-org/navykus.git"  # или копируйте вручную

# 4. Запустить
chmod +x deploy.sh
./deploy.sh
```

**Если нет Git-репозитория** — загрузите проект вручную через SCP перед запуском:

```bash
# На локальной машине (Windows):
# Собрать фронтенд
cd D:\Navykus
npm run build

# Создать архив с проектом (исключая node_modules)
tar --exclude=node_modules -czf navykus.tar.gz .

# На сервере
scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/navykus.tar.gz
ssh root@95.163.227.196
cd /home/ubuntu
tar -xzf navykus.tar.gz -C navykus
chown -R ubuntu:ubuntu navykus
```

---

## Вариант 2: Ручной деплой (пошагово)

### Шаг 1. Подключение к серверу

```bash
ssh root@95.163.227.196
```

### Шаг 2. Установка зависимостей

```bash
# Обновление пакетов
apt-get update && apt-get upgrade -y

# Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs git nginx certbot python3-certbot-nginx build-essential

# PM2
npm install -g pm2

# Проверка
node -v   # >= 22
npm -v
nginx -v
```

### Шаг 3. Копирование проекта

**На локальной машине (Windows PowerShell):**
```powershell
# Собрать фронтенд
cd D:\Navykus
npm run build

# Установить OpenSSH (если нет) или использовать WinSCP
# Создать архив
tar -czf navykus.tar.gz --exclude=node_modules --exclude=.git .
```

**На сервере:**
```bash
# Создать пользователя и папку
useradd -m -s /bin/bash ubuntu || true
mkdir -p /home/ubuntu/navykus

# Скопировать архив (с локальной машины)
# scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/

# Распаковать
cd /home/ubuntu
tar -xzf navykus.tar.gz -C navykus
chown -R ubuntu:ubuntu navykus
cd navykus
```

### Шаг 4. Настройка окружения

```bash
cd /home/ubuntu/navykus

# Сгенерировать секреты
PAYLOAD_SECRET=$(openssl rand -base64 32)
ADMIN_PASSWORD=$(openssl rand -base64 16)

# Создать .env
cat > .env <<EOF
NODE_ENV=production
API_PORT=4000
SERVER_URL=https://navykus.org
CORS_ORIGIN=https://navykus.org
PAYLOAD_PUBLIC_SERVER_URL=https://navykus.org/admin
PAYLOAD_SECRET=${PAYLOAD_SECRET}
DATABASE_URL=file:./payload.db
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@navykus.org
SMTP_FROM_NAME=Navykus
ADMIN_EMAIL=admin@navykus.org
ADMIN_PASSWORD=${ADMIN_PASSWORD}
GOOGLE_GENAI_API_KEY=
EOF

echo "Admin password: ${ADMIN_PASSWORD}"  # Сохраните!
```

### Шаг 5. Установка зависимостей и сборка

```bash
cd /home/ubuntu/navykus
npm install --production=false
npm run build
```

### Шаг 6. Миграция и наполнение БД

```bash
cd /home/ubuntu/navykus

# Миграции
npx payload migrate --config src/payload.config.ts

# Наполнение демо-данными
npx tsx scripts/seed-payload.ts
```

### Шаг 7. Создание папок для загрузок

```bash
cd /home/ubuntu/navykus
mkdir -p uploads/incoming uploads/media uploads/avatars
chown -R ubuntu:ubuntu uploads
```

### Шаг 8. Настройка Nginx

```bash
cat > /etc/nginx/sites-available/navykus <<'NGINXEOF'
server {
    listen 80;
    server_name navykus.org www.navykus.org;

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

# Активировать конфиг
rm -f /etc/nginx/sites-enabled/default
ln -s /etc/nginx/sites-available/navykus /etc/nginx/sites-enabled/

# Проверить и перезагрузить
nginx -t
systemctl reload nginx
```

### Шаг 9. Запуск через PM2

```bash
cd /home/ubuntu/navykus
pm2 start npm --name "navykus-api" -- start -- run start:api
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
# Выполнить команду, которую выведет pm2 startup
```

### Шаг 10. SSL-сертификат (Let's Encrypt)

```bash
certbot --nginx -d navykus.org -d www.navykus.org \
  --non-interactive --agree-tos --email admin@navykus.org
```

### Шаг 11. Проверка

```bash
curl -s http://127.0.0.1:4000/api/health
# Должен ответить: {"ok":true,"service":"navykus-express-payload","db":"connected"}
```

---

## 🔧 Полезные команды

| Команда | Описание |
|---|---|
| `pm2 status` | Статус процессов |
| `pm2 logs navykus-api` | Логи приложения |
| `pm2 restart navykus-api` | Перезапуск |
| `pm2 monit` | Мониторинг в реальном времени |
| `sudo nginx -t` | Проверка конфига Nginx |
| `sudo systemctl reload nginx` | Перезагрузка Nginx |
| `sudo certbot renew` | Обновление SSL (автоматически каждый месяц) |
| `journalctl -u nginx -f` | Логи Nginx |

## 🔄 Обновление проекта

```bash
cd /home/ubuntu/navykus

# Если через Git
git pull

# Если вручную — перезалейте архив и распакуйте
# scp navykus.tar.gz root@95.163.227.196:/home/ubuntu/

npm install
npm run build
npx payload migrate --config src/payload.config.ts
pm2 restart navykus-api
```

## 🐛 Решение проблем

**502 Bad Gateway** — Express не запущен:
```bash
pm2 start navykus-api
```

**Cannot find module** — не установлены зависимости:
```bash
cd /home/ubuntu/navykus && npm install
```

**Permission denied** — неправильные права:
```bash
chown -R ubuntu:ubuntu /home/ubuntu/navykus
chown -R ubuntu:ubuntu /home/ubuntu/navykus/uploads
chmod 755 /home/ubuntu/navykus/payload.db
```

**Cannot write to database** — SQLite файл заблокирован:
```bash
chmod 666 /home/ubuntu/navykus/payload.db
```
