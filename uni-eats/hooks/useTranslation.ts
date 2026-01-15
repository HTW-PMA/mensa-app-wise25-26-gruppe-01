import { useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t as translate } from '@/utils/i18n';

export function useTranslation() {
  const { locale } = useLanguage();
  const t = useCallback(
    (key: string, options?: Record<string, unknown>) => translate(key, options),
    [locale]
  );
  return { t, locale };
}
