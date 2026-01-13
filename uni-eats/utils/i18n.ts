import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';
import en from '@/locales/en.json';
import de from '@/locales/de.json';

export type SupportedLocale = 'en' | 'de';

const i18n = new I18n({ en, de });
i18n.enableFallback = true;
i18n.defaultLocale = 'en';
i18n.locale = 'en';

const resolveLocale = (locale?: string | null): SupportedLocale => {
  if (locale?.toLowerCase().startsWith('de')) return 'de';
  return 'en';
};

export const getDeviceLocale = (): SupportedLocale => {
  const locales = Localization.getLocales();
  const tag = locales?.[0]?.languageTag ?? locales?.[0]?.languageCode;
  return resolveLocale(tag);
};

export const setLocale = (locale: SupportedLocale) => {
  i18n.locale = locale;
};

export const getLocale = (): SupportedLocale => resolveLocale(i18n.locale);

export const t = (key: string, options?: Record<string, unknown>) =>
  i18n.t(key, options);
