import { isValidEmail, isValidPhone, isValidPassword, isValidLatitude, isValidLongitude } from '../validation';

describe('isValidEmail', () => {
  it('accepts a well-formed email', () => {
    expect(isValidEmail('manager@restaurant.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('manager.restaurant.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('manager@')).toBe(false);
  });

  it('rejects missing TLD', () => {
    expect(isValidEmail('manager@restaurant')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });

  it('rejects whitespace-only', () => {
    expect(isValidEmail('   ')).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(null)).toBe(false);
  });
});

describe('isValidPhone', () => {
  it('accepts a plain 10-digit US number', () => {
    expect(isValidPhone('2125550100')).toBe(true);
  });

  it('accepts a formatted number with punctuation', () => {
    expect(isValidPhone('(212) 555-0100')).toBe(true);
  });

  it('accepts an international number with country code', () => {
    expect(isValidPhone('+353 1 555 0100')).toBe(true);
  });

  it('rejects too few digits', () => {
    expect(isValidPhone('12345')).toBe(false);
  });

  it('rejects too many digits', () => {
    expect(isValidPhone('1234567890123456')).toBe(false);
  });

  it('rejects letters', () => {
    expect(isValidPhone('call-the-store')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPhone('')).toBe(false);
  });
});

describe('isValidPassword', () => {
  it('accepts an 8-character password', () => {
    expect(isValidPassword('abcd1234')).toBe(true);
  });

  it('rejects a 7-character password', () => {
    expect(isValidPassword('abcd123')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidPassword('')).toBe(false);
  });
});

describe('isValidLatitude / isValidLongitude', () => {
  it('accepts a valid latitude', () => {
    expect(isValidLatitude('40.7589')).toBe(true);
  });

  it('accepts boundary values', () => {
    expect(isValidLatitude('90')).toBe(true);
    expect(isValidLatitude('-90')).toBe(true);
    expect(isValidLongitude('180')).toBe(true);
    expect(isValidLongitude('-180')).toBe(true);
  });

  it('rejects out-of-range latitude', () => {
    expect(isValidLatitude('91')).toBe(false);
    expect(isValidLatitude('-91')).toBe(false);
  });

  it('rejects out-of-range longitude', () => {
    expect(isValidLongitude('181')).toBe(false);
    expect(isValidLongitude('-181')).toBe(false);
  });

  it('rejects non-numeric input', () => {
    expect(isValidLatitude('not-a-number')).toBe(false);
  });

  // The bug this whole change was written to catch: Number('') is 0, not
  // NaN, so a naive range check would treat a blank field as valid (0, 0).
  it('rejects blank input rather than silently treating it as 0', () => {
    expect(isValidLatitude('')).toBe(false);
    expect(isValidLatitude('   ')).toBe(false);
    expect(isValidLongitude('')).toBe(false);
  });
});
