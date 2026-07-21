import 'dotenv/config';
import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 465,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM = process.env.SMTP_FROM || 'info@navykus.online';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'Navykus';

console.log('=== SMTP Test ===');
console.log(`Host: ${SMTP_CONFIG.host}`);
console.log(`Port: ${SMTP_CONFIG.port}`);
console.log(`Secure: ${SMTP_CONFIG.secure}`);
console.log(`User: ${SMTP_CONFIG.auth.user}`);
console.log(`From: ${FROM_NAME} <${FROM}>`);
console.log('');

const transporter = nodemailer.createTransport(SMTP_CONFIG);

try {
  // 1. Verify SMTP connection
  console.log('1. Verifying SMTP connection...');
  await transporter.verify();
  console.log('   ✅ SMTP connection OK!');

  // 2. Send a test email
  console.log('2. Sending test email...');
  const info = await transporter.sendMail({
    from: `${FROM_NAME} <${FROM}>`,
    to: FROM, // send to self for testing
    subject: 'Navykus — SMTP Test',
    text: 'This is a test email from Navykus SMTP configuration.\n\nIf you received this, email is working correctly!',
    html: `
      <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h1 style="font-size: 24px; color: #1b1816;">Navykus — SMTP Test</h1>
        <p style="font-size: 14px; color: #5b6472;">This is a test email from Navykus SMTP configuration.</p>
        <p style="font-size: 14px; color: #5b6472;">If you received this, email is working correctly!</p>
      </div>
    `,
  });

  console.log(`   ✅ Email sent! Message ID: ${info.messageId}`);
  console.log(`   📬 Check your inbox at: ${FROM}`);

  if (process.env.NODE_ENV !== 'production' && info.response) {
    console.log(`   Server response: ${info.response}`);
  }

} catch (error) {
  console.error('   ❌ SMTP Error:', error.message);
  if (error.code) console.error(`   Code: ${error.code}`);
  if (error.command) console.error(`   Command: ${error.command}`);
  process.exit(1);
} finally {
  transporter.close();
}
