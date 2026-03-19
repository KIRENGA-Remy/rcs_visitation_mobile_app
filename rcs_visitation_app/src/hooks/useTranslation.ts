import { useAuthStore } from '@stores/authStore';
import { t as translate, type TranslationKey } from '@i18n';

export const useTranslation = () => {
  const { language } = useAuthStore();
  return {
    t: (key: TranslationKey) => translate(key, language),
    language,
  };
};
