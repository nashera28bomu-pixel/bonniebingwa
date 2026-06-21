// Lightweight phone -> country resolver using E.164 calling codes.
// Covers African countries first (primary market) plus common global ones.
// Sorted longest-prefix-first so e.g. +254 (Kenya) doesn't get swallowed by a shorter match.

const CALLING_CODES = [
  // Africa
  { code: '254', name: 'Kenya', flag: '🇰🇪' },
  { code: '255', name: 'Tanzania', flag: '🇹🇿' },
  { code: '256', name: 'Uganda', flag: '🇺🇬' },
  { code: '250', name: 'Rwanda', flag: '🇷🇼' },
  { code: '251', name: 'Ethiopia', flag: '🇪🇹' },
  { code: '252', name: 'Somalia', flag: '🇸🇴' },
  { code: '253', name: 'Djibouti', flag: '🇩🇯' },
  { code: '257', name: 'Burundi', flag: '🇧🇮' },
  { code: '260', name: 'Zambia', flag: '🇿🇲' },
  { code: '263', name: 'Zimbabwe', flag: '🇿🇼' },
  { code: '234', name: 'Nigeria', flag: '🇳🇬' },
  { code: '233', name: 'Ghana', flag: '🇬🇭' },
  { code: '27', name: 'South Africa', flag: '🇿🇦' },
  { code: '20', name: 'Egypt', flag: '🇪🇬' },
  { code: '212', name: 'Morocco', flag: '🇲🇦' },
  { code: '221', name: 'Senegal', flag: '🇸🇳' },
  { code: '225', name: 'Ivory Coast', flag: '🇨🇮' },
  { code: '243', name: 'DR Congo', flag: '🇨🇩' },
  { code: '237', name: 'Cameroon', flag: '🇨🇲' },
  { code: '231', name: 'Liberia', flag: '🇱🇷' },
  { code: '232', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: '265', name: 'Malawi', flag: '🇲🇼' },
  { code: '258', name: 'Mozambique', flag: '🇲🇿' },

  // Common global
  { code: '1', name: 'USA/Canada', flag: '🇺🇸' },
  { code: '44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '91', name: 'India', flag: '🇮🇳' },
  { code: '86', name: 'China', flag: '🇨🇳' },
  { code: '49', name: 'Germany', flag: '🇩🇪' },
  { code: '33', name: 'France', flag: '🇫🇷' },
  { code: '971', name: 'UAE', flag: '🇦🇪' },
  { code: '966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '61', name: 'Australia', flag: '🇦🇺' },
  { code: '81', name: 'Japan', flag: '🇯🇵' },
  { code: '7', name: 'Russia/Kazakhstan', flag: '🇷🇺' },
  { code: '55', name: 'Brazil', flag: '🇧🇷' },
  { code: '52', name: 'Mexico', flag: '🇲🇽' },
  { code: '63', name: 'Philippines', flag: '🇵🇭' },
  { code: '92', name: 'Pakistan', flag: '🇵🇰' },
  { code: '880', name: 'Bangladesh', flag: '🇧🇩' },
].sort((a, b) => b.code.length - a.code.length); // longest prefix first

/**
 * Normalizes a raw phone number into E.164-ish format (+ and digits only).
 * Assumes Kenyan local format (07xx / 01xx) if no country code given.
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let cleaned = raw.replace(/[\s\-()]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }
  if (cleaned.startsWith('00')) {
    return '+' + cleaned.slice(2);
  }
  // Local Kenyan format: 07xxxxxxxx or 01xxxxxxxx -> +2547xxxxxxxx
  if (/^0[17]\d{8}$/.test(cleaned)) {
    return '+254' + cleaned.slice(1);
  }
  // Already has country code but missing +
  if (/^\d{10,15}$/.test(cleaned)) {
    return '+' + cleaned;
  }
  return cleaned;
}

/**
 * Resolves a normalized phone number to a country name + flag.
 */
export function resolveCountry(normalizedPhone) {
  if (!normalizedPhone || !normalizedPhone.startsWith('+')) {
    return { code: '', name: 'Unknown', flag: '🏳️' };
  }
  const digits = normalizedPhone.slice(1);

  for (const entry of CALLING_CODES) {
    if (digits.startsWith(entry.code)) {
      return entry;
    }
  }
  return { code: '', name: 'Unknown', flag: '🏳️' };
}
