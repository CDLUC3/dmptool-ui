
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