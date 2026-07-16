export type PasswordIssues = {
  weak: boolean;
  reasons: string[];
  score: number;
};

const COMMON_WEAK_PASSWORDS = new Set([
  'password',
  'password1',
  '12345678',
  '123456789',
  '11111111',
  '00000000',
  'qwerty12',
  'abc12345',
  'iloveyou1',
]);

export const MIN_PASSWORD_LENGTH = 8;

export const evaluatePassword = (password: string): PasswordIssues => {
  const reasons: string[] = [];
  let score = 0;

  if (password.length >= MIN_PASSWORD_LENGTH) score += 1;
  else reasons.push('TOO_SHORT');

  if (/[a-z]/.test(password)) score += 1;
  else reasons.push('NO_LOWERCASE');

  if (/[A-Z]/.test(password)) score += 1;
  else reasons.push('NO_UPPERCASE');

  if (/\d/.test(password)) score += 1;
  else reasons.push('NO_DIGIT');

  const isCommon = COMMON_WEAK_PASSWORDS.has(password.toLowerCase());
  if (isCommon) {
    reasons.push('TOO_COMMON');
    score = Math.min(score, 1);
  }

  return {
    weak: score < 3 || isCommon,
    reasons,
    score,
  };
};
