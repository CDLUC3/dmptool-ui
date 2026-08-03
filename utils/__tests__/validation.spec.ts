import {
  isValidEmail,
  isEmailListValid,
  getPasswordRequirements,
  isValidPassword,
} from '../validation';

// ---------------------------------------------------------------------
// isValidEmail
// ---------------------------------------------------------------------

describe('isValidEmail', () => {
  it('returns true for a standard email address', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('returns true for an email with a subdomain and multi-part TLD', () => {
    expect(isValidEmail('user.name+tag@example.co.uk')).toBe(true);
  });

  it('returns false for an empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('returns false when there is no "@"', () => {
    expect(isValidEmail('plainaddress')).toBe(false);
  });

  it('returns false when there is no domain (no "." after "@")', () => {
    expect(isValidEmail('user@localhost')).toBe(false);
  });

  it('returns false with a trailing dot and nothing after it', () => {
    expect(isValidEmail('user@example.')).toBe(false);
  });

  it('returns false with two "@" symbols', () => {
    expect(isValidEmail('user@@example.com')).toBe(false);
  });

  it('returns false with no local part before "@"', () => {
    expect(isValidEmail('@example.com')).toBe(false);
  });

  it('returns false when the local part contains a space', () => {
    expect(isValidEmail('user example@example.com')).toBe(false);
  });

  it('returns false when the domain contains a space', () => {
    expect(isValidEmail('user@ex ample.com')).toBe(false);
  });

  it('returns false with a leading space', () => {
    expect(isValidEmail(' user@example.com')).toBe(false);
  });

  it('returns false with a trailing space', () => {
    expect(isValidEmail('user@example.com ')).toBe(false);
  });
});

// ---------------------------------------------------------------------
// isEmailListValid
// ---------------------------------------------------------------------

describe('isEmailListValid', () => {
  it('returns false for an empty string', () => {
    expect(isEmailListValid('')).toBe(false);
  });

  it('returns true for a single valid email', () => {
    expect(isEmailListValid('a@b.com')).toBe(true);
  });

  it('returns true for multiple valid, comma-separated emails', () => {
    expect(isEmailListValid('a@b.com,c@d.com')).toBe(true);
  });

  it('returns true when entries have surrounding whitespace', () => {
    expect(isEmailListValid('a@b.com, c@d.com , e@f.com')).toBe(true);
  });

  it('returns false if any entry in the list is an invalid email', () => {
    expect(isEmailListValid('a@b.com,notanemail')).toBe(false);
  });

  // These next two are documenting real (if perhaps surprising) behavior:
  // blank segments are trimmed and filtered out before validation runs,
  // so they don't cause a false result on their own.
  it('ignores empty segments caused by consecutive commas', () => {
    expect(isEmailListValid('a@b.com,,c@d.com')).toBe(true);
  });

  it('ignores a trailing comma with nothing after it', () => {
    expect(isEmailListValid('a@b.com,')).toBe(true);
  });

  it('returns true for a whitespace-only string, since it reduces to an empty list', () => {
    // '   '.split(',') => ['   '] => trim => [''] => filter(Boolean) => []
    // Array.prototype.every() on an empty array is vacuously true.
    expect(isEmailListValid('   ')).toBe(true);
  });
});

// ---------------------------------------------------------------------
// getPasswordRequirements
// ---------------------------------------------------------------------

describe('getPasswordRequirements', () => {
  it('marks every requirement as unmet for an empty password', () => {
    const requirements = getPasswordRequirements('');

    expect(requirements).toEqual([
      { key: 'minLength', isMet: false },
      { key: 'hasUppercase', isMet: false },
      { key: 'hasLowercase', isMet: false },
      { key: 'hasNumber', isMet: false },
      { key: 'hasSpecialChar', isMet: false },
    ]);
  });

  it('marks every requirement as met for a password satisfying all rules', () => {
    const requirements = getPasswordRequirements('Abcdefg1!');

    expect(requirements).toEqual([
      { key: 'minLength', isMet: true },
      { key: 'hasUppercase', isMet: true },
      { key: 'hasLowercase', isMet: true },
      { key: 'hasNumber', isMet: true },
      { key: 'hasSpecialChar', isMet: true },
    ]);
  });

  describe('minLength', () => {
    it('is unmet for passwords shorter than 8 characters', () => {
      const result = getPasswordRequirements('Abc1!');
      expect(result.find(r => r.key === 'minLength')?.isMet).toBe(false);
    });

    it('is met for a password exactly 8 characters long', () => {
      const result = getPasswordRequirements('Abcdefg1');
      expect(result.find(r => r.key === 'minLength')?.isMet).toBe(true);
    });
  });

  describe('hasUppercase / hasLowercase / hasNumber', () => {
    it('is unmet when the password has no uppercase letters', () => {
      const result = getPasswordRequirements('abcdefg1!');
      expect(result.find(r => r.key === 'hasUppercase')?.isMet).toBe(false);
    });

    it('is unmet when the password has no lowercase letters', () => {
      const result = getPasswordRequirements('ABCDEFG1!');
      expect(result.find(r => r.key === 'hasLowercase')?.isMet).toBe(false);
    });

    it('is unmet when the password has no digits', () => {
      const result = getPasswordRequirements('Abcdefgh!');
      expect(result.find(r => r.key === 'hasNumber')?.isMet).toBe(false);
    });
  });

  describe('hasSpecialChar', () => {
    it.each([
      ['`', 'backtick'],
      ['!', 'exclamation mark'],
      ['@', 'at sign'],
      ['#', 'hash'],
      ['$', 'dollar sign'],
      ['%', 'percent'],
      ['^', 'caret'],
      ['&', 'ampersand'],
      ['*', 'asterisk'],
      ['_', 'underscore'],
      ['+', 'plus'],
      ['-', 'hyphen'],
      ['=', 'equals'],
      ['?', 'question mark'],
      ['~', 'tilde'],
      [' ', 'space'],
    ])('is met when the password contains an allowed special character (%s / %s)', (char) => {
      const result = getPasswordRequirements(`Abcdefg1${char}`);
      expect(result.find(r => r.key === 'hasSpecialChar')?.isMet).toBe(true);
    });

    it.each([
      ['(', 'open paren'],
      [')', 'close paren'],
      ['{', 'open brace'],
      ['}', 'close brace'],
      ['[', 'open bracket'],
      [']', 'close bracket'],
      ['|', 'pipe'],
      ['\\', 'backslash'],
      [':', 'colon'],
      [';', 'semicolon'],
      ['"', 'double quote'],
      ["'", 'single quote'],
      ['<', 'less than'],
      ['>', 'greater than'],
      [',', 'comma'],
      ['.', 'period'],
      ['/', 'forward slash'],
    ])('is unmet when the only non-alphanumeric character is a disallowed one (%s / %s)', (char) => {
      const result = getPasswordRequirements(`Abcdefg1${char}`);
      expect(result.find(r => r.key === 'hasSpecialChar')?.isMet).toBe(false);
    });

    it('is unmet when the password has no non-alphanumeric characters at all', () => {
      const result = getPasswordRequirements('Abcdefg1');
      expect(result.find(r => r.key === 'hasSpecialChar')?.isMet).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------
// isValidPassword
// ---------------------------------------------------------------------

describe('isValidPassword', () => {
  it('returns false for an empty password', () => {
    expect(isValidPassword('')).toBe(false);
  });

  it('returns true when every requirement is met', () => {
    expect(isValidPassword('Abcdefg1!')).toBe(true);
  });

  it('returns false when just one requirement is unmet (missing uppercase)', () => {
    expect(isValidPassword('abcdefg1!')).toBe(false);
  });

  it('returns false when the password is too short even if all other rules are met', () => {
    expect(isValidPassword('Ab1!')).toBe(false);
  });

  it('returns false when the only special character present is a disallowed one', () => {
    expect(isValidPassword('Abcdefg1.')).toBe(false);
  });
});