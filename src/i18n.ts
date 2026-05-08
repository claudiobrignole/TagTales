import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import it from './locales/it.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      it: { translation: it },
    },
    fallbackLng: 'it',
    lng: 'it', // Provide default initial language
    supportedLngs: ['en', 'it'],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
