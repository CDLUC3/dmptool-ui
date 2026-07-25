
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isEmailListValid = (value: string): boolean => {
  if (!value) return false;
  return value
    .split(",")
    .map(e => e.trim())
    .filter(Boolean)
    .every(isValidEmail);
};

const PASSWORD_SPECIAL_CHARS_REGEX = /[`!@#$%^&*_+\-=?~\s]/;
// eslint-disable-next-line no-useless-escape
const PASSWORD_BAD_SPECIAL_CHARS_REGEX = /[\(\)\{\}\[\]\|\\:;"'<>\,\.\/]/;

export type PasswordRequirement = {
  key: string;
  isMet: boolean;
};

export function getPasswordRequirements(password: string): PasswordRequirement[] {
  return [
    { key: 'minLength', isMet: password.length >= 8 },
    { key: 'hasUppercase', isMet: /[A-Z]/.test(password) },
    { key: 'hasLowercase', isMet: /[a-z]/.test(password) },
    { key: 'hasNumber', isMet: /\d/.test(password) },
    {
      key: 'hasSpecialChar',
      isMet: PASSWORD_SPECIAL_CHARS_REGEX.test(password) && !PASSWORD_BAD_SPECIAL_CHARS_REGEX.test(password),
    },
  ];
}

export function isValidPassword(password: string): boolean {
  return !!password && getPasswordRequirements(password).every(r => r.isMet);
}
