export type Locale = 'en' | 'zh-TW';

export const locales: Locale[] = ['en', 'zh-TW'];
export const defaultLocale: Locale = 'en';

export const localeNames: Record<Locale, string> = {
  'en': 'English',
  'zh-TW': '繁體中文',
};
