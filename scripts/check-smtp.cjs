require('dotenv/config');

const nodemailer = require('nodemailer');

const host = process.env.SMTP_HOST && process.env.SMTP_HOST.trim();
const user = process.env.SMTP_USER && process.env.SMTP_USER.trim();
const pass = process.env.SMTP_PASS || '';
const port = Number(process.env.SMTP_PORT || 587);
const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
const from = process.env.SMTP_FROM || '';

const missing = [
  ['SMTP_HOST', host],
  ['SMTP_USER', user],
  ['SMTP_PASS', pass],
].filter(([, value]) => !value);

console.log(`SMTP host=${host || '<missing>'} port=${port} secure=${secure} user=${user || '<missing>'} from=${from || '<missing>'} passLength=${pass.length}`);

if (missing.length) {
  console.error(`SMTP missing config: ${missing.map(([name]) => name).join(', ')}`);
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
});

transporter.verify((error) => {
  if (!error) {
    console.log('SMTP ok: server accepted credentials');
    return;
  }

  const responseCode = error.responseCode || error.code || 'unknown';
  console.error(`SMTP failed: ${responseCode}`);
  console.error(error.response || error.message);

  if (Number(error.responseCode) === 535) {
    console.error('SMTP 535 means the SMTP server rejected the username/password for this host/port/security mode.');
    console.error('Check whether SMTP auth is enabled for the mailbox, whether an app password is required, or whether the provider blocks auth from this server/IP.');
  }

  process.exit(1);
});
