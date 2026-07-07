const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email) {
  return typeof email === 'string' && EMAIL_PATTERN.test(email.trim());
}

// Strips everything but digits and checks a plausible length (7-15, covers
// local numbers through full E.164 international numbers) rather than
// enforcing one specific country's format.
export function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  const digitsOnly = phone.replace(/\D/g, '');
  return digitsOnly.length >= 7 && digitsOnly.length <= 15;
}

export function isValidPassword(password) {
  return typeof password === 'string' && password.length >= 8;
}

// Number('') and Number('   ') both evaluate to 0, not NaN — so a blank
// coordinate field would otherwise silently pass as valid (0, 0). Reject
// blank/whitespace-only input explicitly before the numeric range check.
export function isValidCoordinate(value, min, max) {
  if (typeof value !== 'string' || value.trim() === '') return false;
  const num = Number(value);
  return Number.isFinite(num) && num >= min && num <= max;
}

export function isValidLatitude(value) {
  return isValidCoordinate(value, -90, 90);
}

export function isValidLongitude(value) {
  return isValidCoordinate(value, -180, 180);
}
