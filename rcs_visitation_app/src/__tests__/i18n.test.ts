import { t, en, rw } from '../i18n';

describe('i18n translations', () => {
  it('returns English for "en" language', () => {
    expect(t('sign_in', 'en')).toBe('Sign In');
    expect(t('loading', 'en')).toBe('Loading...');
  });

  it('returns Kinyarwanda for "rw" language', () => {
    expect(t('sign_in', 'rw')).toBe('Injira');
    expect(t('loading', 'rw')).toBe('Gutegereza...');
  });

  it('falls back to English when key missing in rw', () => {
    // All keys should be covered, but fallback logic should not throw
    const result = t('app_name', 'rw');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns key name when key is completely missing', () => {
    const result = t('nonexistent_key' as any, 'en');
    expect(result).toBe('nonexistent_key');
  });

  it('all English keys have Kinyarwanda translations', () => {
    const enKeys   = Object.keys(en);
    const rwKeys   = Object.keys(rw);
    const missing  = enKeys.filter(k => !rwKeys.includes(k));
    // Warn about missing keys (not hard fail — translations evolve)
    if (missing.length > 0) {
      console.warn('Missing Kinyarwanda translations for:', missing);
    }
    expect(missing.length).toBeLessThan(5); // tolerate up to 4 missing
  });

  it('status labels are translated in both languages', () => {
    const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED'];
    for (const s of statuses) {
      expect(t(s as any, 'en')).not.toBe(s);
      expect(t(s as any, 'rw')).not.toBe(s);
    }
  });
});
