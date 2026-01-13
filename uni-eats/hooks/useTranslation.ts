import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/utils/i18n';

export function useTranslation() {
  const { locale } = useLanguage();
  return { t, locale };
}
