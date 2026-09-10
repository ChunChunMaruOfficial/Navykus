import type { Payload } from 'payload';

// All outgoing letters go out from the project mailbox, so recipients can simply reply.
export const MAIL_FROM_ADDRESS = (process.env.SMTP_FROM || process.env.SMTP_USER || 'info@navykus.tech').trim();
export const MAIL_FROM_NAME = (process.env.SMTP_FROM_NAME || 'Navykus').trim();

export const isMailConfigured = () =>
  Boolean(process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS);

export type MailResult = { ok: true; messageId?: string } | { ok: false; error: string };

const describeError = (error: unknown) => {
  const current = error as { code?: string; responseCode?: number; response?: string; message?: string };
  const parts = [current?.code, current?.responseCode, current?.response || current?.message].filter(Boolean);
  const text = parts.join(' ').trim() || 'Unknown error';
  if (current?.responseCode === 535 || /\b535\b/.test(text)) {
    return `${text} — SMTP-сервер отклонил логин/пароль (проверьте SMTP_USER / SMTP_PASS).`;
  }
  if (/ETIMEDOUT|ECONNREFUSED|ESOCKET|ENOTFOUND|EHOSTUNREACH/i.test(text)) {
    return `${text} — нет соединения с SMTP-сервером (хост/порт или исходящий SMTP заблокирован на сервере).`;
  }
  return text;
};

/**
 * Sends one letter through Payload's nodemailer transport. Never throws: returns the
 * outcome with a human-readable reason, so callers can log it or show it to the editor.
 */
export const sendMail = async (
  payload: Payload,
  message: { to: string; subject: string; html: string; text: string },
): Promise<MailResult> => {
  if (!isMailConfigured()) {
    const error = 'SMTP не настроен: задайте SMTP_HOST, SMTP_USER и SMTP_PASS в .env и перезапустите процессы.';
    console.error(`[mail] not sent to ${message.to}: ${error}`);
    return { ok: false, error };
  }
  try {
    const info = await payload.sendEmail({
      ...message,
      from: `"${MAIL_FROM_NAME}" <${MAIL_FROM_ADDRESS}>`,
      replyTo: MAIL_FROM_ADDRESS,
    }) as { messageId?: string } | undefined;
    console.log(`[mail] sent "${message.subject}" to ${message.to}${info?.messageId ? ` (${info.messageId})` : ''}`);
    return { ok: true, messageId: info?.messageId };
  } catch (error) {
    const reason = describeError(error);
    console.error(`[mail] failed to send "${message.subject}" to ${message.to}: ${reason}`);
    return { ok: false, error: reason };
  }
};
