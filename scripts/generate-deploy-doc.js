import fs from 'node:fs';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle, ShadingType, LevelFormat, NumberFormat, convertInchesToTwip } from 'docx';

const OUTPUT_PATH = path.resolve(process.cwd(), 'deploy-yandex-cloud.docx');

const COLORS = {
  primary: '80261B',
  secondary: '5B6472',
  accent: 'BC4638',
  code: '1A1A1A',
  codeBg: 'F5F2F0',
  white: 'FFFFFF',
  tableHeader: 'BC4638',
  tableBorder: 'D8D1CC',
};

const borders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
  left: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
  right: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder },
};

const codeStyle = (text, options = {}) => new TextRun({
  text,
  font: 'Consolas',
  size: 18,
  color: COLORS.code,
  ...options,
});

const inlineCode = (text) => new TextRun({
  text,
  font: 'Consolas',
  size: 20,
  color: COLORS.accent,
});

const normalText = (text, options = {}) => new TextRun({
  text,
  font: 'Segoe UI',
  size: 22,
  color: COLORS.secondary,
  ...options,
});

const boldText = (text, options = {}) => new TextRun({
  text,
  font: 'Segoe UI',
  size: 22,
  color: COLORS.secondary,
  bold: true,
  ...options,
});

const accentText = (text, options = {}) => new TextRun({
  text,
  font: 'Segoe UI',
  size: 22,
  color: COLORS.accent,
  bold: true,
  ...options,
});

const heading1 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_1,
  spacing: { before: 400, after: 200 },
  children: [new TextRun({ text, font: 'Segoe UI', size: 36, color: COLORS.primary, bold: true })],
});

const heading2 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_2,
  spacing: { before: 300, after: 150 },
  children: [new TextRun({ text, font: 'Segoe UI', size: 28, color: COLORS.accent, bold: true })],
});

const heading3 = (text) => new Paragraph({
  heading: HeadingLevel.HEADING_3,
  spacing: { before: 250, after: 120 },
  children: [new TextRun({ text, font: 'Segoe UI', size: 24, color: COLORS.primary, semiBold: true })],
});

const paragraph = (...children) => new Paragraph({
  spacing: { before: 80, after: 80, line: 320 },
  children,
});

const bullet = (...children) => new Paragraph({
  spacing: { before: 60, after: 60, line: 300 },
  bullet: { level: 0 },
  children,
});

const codeBlock = (code) => {
  const lines = code.split('\n');
  return lines.map((line, i) => new Paragraph({
    spacing: { before: i === 0 ? 60 : 0, after: 0, line: 260 },
    indent: { left: convertInchesToTwip(0.3) },
    shading: { type: ShadingType.CLEAR, fill: COLORS.codeBg },
    children: [codeStyle(line)],
  }));
};

const noteBlock = (...children) => {
  const text = new Paragraph({
    spacing: { before: 100, after: 100, line: 300 },
    indent: { left: convertInchesToTwip(0.2) },
    shading: { type: ShadingType.CLEAR, fill: 'FFF8F5' },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: COLORS.accent },
    },
    children,
  });
  return text;
};

const emptyLine = () => new Paragraph({ spacing: { before: 0, after: 0 }, children: [] });

const createTable = (headers, rows) => {
  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h) => new TableCell({
      width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: COLORS.accent },
      borders,
      children: [new Paragraph({
        spacing: { before: 60, after: 60 },
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: h, font: 'Segoe UI', size: 20, color: COLORS.white, bold: true })],
      })],
    })),
  });

  const dataRows = rows.map((cells) => new TableRow({
    children: cells.map((cell, i) => new TableCell({
      width: { size: 100 / headers.length, type: WidthType.PERCENTAGE },
      borders,
      shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? 'FFFFFF' : 'F9F7F6' },
      children: [new Paragraph({
        spacing: { before: 50, after: 50 },
        children: [normalText(cell, { size: 20 })],
      })],
    })),
  }));

  return new Table({ rows: [headerRow, ...dataRows] });
};

// ========== BUILD DOCUMENT ==========

const children = [

  // TITLE PAGE
  new Paragraph({
    spacing: { before: 3000, after: 0 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Navykus', font: 'Segoe UI', size: 56, color: COLORS.primary, bold: true })],
  }),
  new Paragraph({
    spacing: { before: 100, after: 300 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Деплой на Yandex Cloud', font: 'Segoe UI', size: 32, color: COLORS.accent })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 600 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'Инструкция по развертыванию', font: 'Segoe UI', size: 24, color: COLORS.secondary, italics: true })],
  }),

  // SEPARATOR
  new Paragraph({
    spacing: { before: 0, after: 400 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: COLORS.accent } },
    children: [],
  }),

  // OVERVIEW
  heading1('Обзор проекта'),
  paragraph(
    boldText('Navykus'), normalText(' — это образовательная платформа на стеке:'),
  ),
  bullet(
    boldText('Фронтенд:'), normalText(' Vite + React SPA (сборка в '), inlineCode('dist/'), normalText(')'),
  ),
  bullet(
    boldText('Бэкенд:'), normalText(' Express + PayloadCMS API'),
  ),
  bullet(
    boldText('Админ-панель:'), normalText(' Next.js (отдельно от фронта)'),
  ),
  bullet(
    boldText('База данных:'), normalText(' SQLite ('), inlineCode('payload.db'), normalText(', файловая)'),
  ),
  bullet(
    boldText('Файлы:'), normalText(' загруженные медиа хранятся локально в '), inlineCode('uploads/'), normalText(' и '), inlineCode('uploads/media/'),
  ),

  emptyLine(),
  noteBlock(
    accentText('⚠ Важно: '),
    normalText('SQLite — файловая БД. Файлы загружаются на диск. Поэтому '),
    boldText('Cloud Functions / Serverless Containers не подходят'),
    normalText('. Единственный рабочий вариант — '),
    accentText('Compute Cloud (виртуальная машина)'),
    normalText('.'),
  ),

  // ARCHITECTURE
  heading1('Рекомендуемая архитектура'),
  paragraph(
    normalText('На практике проект использует Express-сервер, который сам раздаёт статику React SPA (из '),
    inlineCode('dist/'),
    normalText('), если она есть. Следовательно, достаточно '),
    boldText('одной ВМ'),
    normalText(', на которой крутится Express, а он отдаёт и API, и фронтенд.'),
  ),

  emptyLine(),

  createTable(
    ['Сервис Yandex Cloud', 'Назначение', 'Примечание'],
    [
      ['Compute Cloud (VM)', 'Express API + React SPA + SQLite', 'Единый сервер, 2 vCPU / 2 GB RAM'],
      ['Object Storage + CDN', '(Опционально) Статика фронта', 'Можно вынести dist/ для скорости'],
      ['DNS', 'Доменное имя', 'Привязать домен к IP ВМ'],
    ],
  ),

  // STEP BY STEP
  heading1('Пошаговая инструкция'),

  heading2('Шаг 1. Собрать фронтенд'),
  paragraph(normalText('На вашей локальной машине:')),
  ...codeBlock([
    'cd D:\\Navykus',
    'npm run build',
    '# → dist/ готова к раздаче',
  ].join('\n')),

  heading2('Шаг 2. Создать виртуальную машину'),
  bullet(boldText('Зайти в'), normalText(' Yandex Cloud Console → Compute Cloud → Виртуальные машины → Создать ВМ')),
  bullet(boldText('Имя:'), normalText(' '), inlineCode('navykus-prod')),
  bullet(boldText('Образ:'), normalText(' Ubuntu 24.04 LTS')),
  bullet(boldText('Тип:'), normalText(' '), inlineCode('standard-v2'), normalText(', 2 vCPU, 2 GB RAM')),
  bullet(boldText('Диск:'), normalText(' 20 GB HDD (SSD по желанию)')),
  bullet(boldText('Сеть:'), normalText(' разрешить порты 22 (SSH), 80 (HTTP), 443 (HTTPS)')),
  bullet(boldText('Доступ:'), normalText(' добавить SSH-ключ (публичный) для подключения')),

  heading2('Шаг 3. Зайти на сервер и подготовить'),
  ...codeBlock([
    'ssh ubuntu@<IP-адрес-ВМ>',
    '',
    '# Node.js 22',
    'curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -',
    'sudo apt install -y nodejs git',
    '',
    '# PM2 — запуск Node.js в фоне',
    'sudo npm i -g pm2',
    '',
    '# Nginx — прокси + SSL',
    'sudo apt install -y nginx certbot python3-certbot-nginx',
  ].join('\n')),

  heading2('Шаг 4. Склонировать проект'),
  ...codeBlock([
    'cd /home/ubuntu',
    'git clone <ссылка-на-ваш-репозиторий> navykus',
    'cd navykus',
  ].join('\n')),

  heading2('Шаг 5. Создать .env'),
  paragraph(normalText('Создайте файл '), inlineCode('.env'), normalText(' в корне проекта:')),
  ...codeBlock([
    'nano .env',
  ].join('\n')),

  emptyLine(),
  paragraph(normalText('Содержимое .env (замените значения на свои):')),
  ...codeBlock([
    'NODE_ENV=production',
    'API_PORT=4000',
    'SERVER_URL=https://navykus.org',
    'PAYLOAD_PUBLIC_SERVER_URL=https://navykus.org/admin',
    'CORS_ORIGIN=https://navykus.org',
    'DATABASE_URL=file:./payload.db',
    'PAYLOAD_SECRET=<длинная-рандомная-строка>',
    'ADMIN_EMAIL=admin@navykus.org',
    'ADMIN_PASSWORD=<надёжный-пароль>',
  ].join('\n')),

  heading2('Шаг 6. Установить зависимости и собрать'),
  ...codeBlock([
    'npm install --production=false',
    'npm run build',
  ].join('\n')),

  heading2('Шаг 7. Проинициализировать БД (если первый запуск)'),
  ...codeBlock([
    'npm run seed:payload',
  ].join('\n')),

  heading2('Шаг 8. Запустить через PM2'),
  ...codeBlock([
    'pm2 start npm --name "navykus-api" -- start:api',
    'pm2 save',
    'pm2 startup systemd',
    '# После pm2 startup — выполните команду, которую он выведет',
  ].join('\n')),

  heading2('Шаг 9. Настроить Nginx'),
  paragraph(normalText('Создайте файл конфигурации:')),
  ...codeBlock([
    'sudo nano /etc/nginx/sites-available/navykus',
  ].join('\n')),

  emptyLine(),
  paragraph(normalText('Вставьте:')),
  ...codeBlock([
    'server {',
    '    listen 80;',
    '    server_name navykus.org www.navykus.org;',
    '',
    '    location / {',
    '        proxy_pass http://127.0.0.1:4000;',
    '        proxy_http_version 1.1;',
    '        proxy_set_header Upgrade $http_upgrade;',
    '        proxy_set_header Connection "upgrade";',
    '        proxy_set_header Host $host;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;',
    '        proxy_set_header X-Forwarded-Proto $scheme;',
    '        proxy_cache_bypass $http_upgrade;',
    '        client_max_body_size 20M;',
    '    }',
    '}',
  ].join('\n')),

  emptyLine(),
  paragraph(normalText('Активируйте конфиг и перезапустите:')),
  ...codeBlock([
    'sudo ln -s /etc/nginx/sites-available/navykus /etc/nginx/sites-enabled/',
    'sudo nginx -t',
    'sudo systemctl restart nginx',
  ].join('\n')),

  heading2('Шаг 10. HTTPS (Let\'s Encrypt)'),
  ...codeBlock([
    'sudo certbot --nginx -d navykus.org -d www.navykus.org',
  ].join('\n')),

  emptyLine(),
  noteBlock(
    normalText('Сертификат обновляется автоматически через '),
    inlineCode('certbot renew'),
    normalText('.'),
  ),

  // ALTERNATIVE
  heading1('Альтернатива: статика на Object Storage + CDN'),
  paragraph(normalText('Если хотите ускорить загрузку страниц (рекомендуется для production):')),
  bullet(normalText('Собираем '), inlineCode('npm run build'), normalText(' — получаем '), inlineCode('dist/')),
  bullet(normalText('В Yandex Cloud: Object Storage → создать бакет')),
  bullet(normalText('Загрузить всё из '), inlineCode('dist/'), normalText(' в корень бакета')),
  bullet(normalText('Включить хостинг статического сайта (index.html)')),
  bullet(normalText('Подключить Cloud CDN к бакету')),
  bullet(normalText('В .env на ВМ указать '), inlineCode('CORS_ORIGIN=https://<cdn-url>')),
  bullet(normalText('В Nginx на ВМ тогда проксировать только '), inlineCode('/api/'), normalText(', '), inlineCode('/admin/'), normalText(', '), inlineCode('/media/')),

  emptyLine(),
  noteBlock(
    normalText('Минус: при каждом обновлении фронта надо повторно заливать статику в бакет.'),
  ),

  // BACKUPS
  heading1('Бэкапы SQLite'),
  paragraph(normalText('База — один файл '), inlineCode('payload.db'), normalText('. Просто копируйте его по расписанию:')),
  ...codeBlock([
    '# Добавить в crontab (crontab -e):',
    '0 3 * * * cp /home/ubuntu/navykus/payload.db \\',
    '  /home/ubuntu/backups/payload-$(date +\\%Y\\%m\\%d).db',
  ].join('\n')),

  emptyLine(),
  noteBlock(
    normalText('Не забывайте также бэкапить папку '),
    inlineCode('uploads/media/'),
    normalText(' — там хранятся все загруженные изображения и файлы.'),
  ),

  // MAINTENANCE
  heading1('Обновление проекта'),
  paragraph(normalText('При новом коммите:')),
  ...codeBlock([
    'cd /home/ubuntu/navykus',
    'git pull',
    'npm install',
    'npm run build',
    'pm2 restart navykus-api',
  ].join('\n')),

  // TROUBLESHOOTING
  heading1('Типовые проблемы'),
  heading3('Не запускается Express'),
  paragraph(normalText('Проверьте, что всё установлено:')),
  ...codeBlock([
    'cd /home/ubuntu/navykus',
    'ls node_modules/.package-lock.json || npm install',
  ].join('\n')),

  heading3('Ошибка 502 Bad Gateway'),
  paragraph(normalText('Проверьте, запущен ли PM2:')),
  ...codeBlock([
    'pm2 list',
    'pm2 logs navykus-api',
  ].join('\n')),

  heading3('Не отправляются файлы'),
  paragraph(normalText('Проверьте права на папки:')),
  ...codeBlock([
    'sudo chown -R ubuntu:ubuntu /home/ubuntu/navykus/uploads',
    'sudo chown -R ubuntu:ubuntu /home/ubuntu/navykus/payload.db',
  ].join('\n')),

  heading3('Не хватает памяти'),
  paragraph(normalText('SQLite при больших данных + PayloadCMS может потреблять >1 GB. Увеличьте RAM ВМ в консоли Yandex Cloud (остановите ВМ → изменить параметры → запустить).')),

  // FOOTER
  emptyLine(),
  new Paragraph({
    spacing: { before: 600, after: 0 },
    alignment: AlignmentType.CENTER,
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: COLORS.tableBorder } },
    children: [new TextRun({ text: 'Сгенерировано для проекта Navykus  •  ' + new Date().toISOString().split('T')[0], font: 'Segoe UI', size: 18, color: COLORS.secondary, italics: true })],
  }),
];

const doc = new Document({
  title: 'Navykus — Деплой на Yandex Cloud',
  description: 'Инструкция по развертыванию проекта Navykus на Yandex Cloud',
  styles: {
    default: {
      document: {
        run: { font: 'Segoe UI', size: 22, color: COLORS.secondary },
      },
    },
  },
  sections: [{ children }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`✅ DOCX создан: ${OUTPUT_PATH}`);
}).catch((err) => {
  console.error('❌ Ошибка:', err);
  process.exit(1);
});
