export const ADMIN_EMAIL = 'admin@navykus.online';
export const ADMIN_VERIFICATION_EMAIL = 'info@navykus.online';
export const ADMIN_USER_ID = 1;

export const normalizeEmail = (email: unknown) => String(email || '').trim().toLowerCase();

export const isAllowedAdminEmail = (email: unknown) => normalizeEmail(email) === ADMIN_EMAIL;

export const isAllowedAdminId = (id: unknown) => String(id || '') === String(ADMIN_USER_ID);

export const adminVerificationRecipient = (email: unknown) =>
  isAllowedAdminEmail(email) ? ADMIN_VERIFICATION_EMAIL : normalizeEmail(email);
