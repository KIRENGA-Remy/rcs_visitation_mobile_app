import { en } from './en';
import { rw } from './rw';

export type TranslationKey = keyof typeof en;
export type Language = 'en' | 'rw';

const translations: Record<Language, typeof en> = { en, rw };

/** Get a translation string. Falls back to English if key missing in rw. */
export const t = (key: TranslationKey, lang: Language = 'en'): string =>
  (translations[lang] as any)[key] ?? (translations.en as any)[key] ?? key;

export { en, rw };
