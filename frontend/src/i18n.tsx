import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json'
import pl from './locales/pl.json'
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  'en-US': { translation: en },
  'pl-PL': { translation: pl }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    supportedLngs: ['en-US', 'pl-PL'],
    fallbackLng: 'en-US',
    saveMissing: false,
    missingKeyHandler: (languages: readonly string[], ns: string, key: string, fallback: string) => {
      console.error(`missing translation of ${ns}:${key}, using ${fallback}`);
    },
    missingInterpolationHandler: (text: string, value: unknown) => {
      console.error(`missing interpolation ${text}, ${value}`);
    },
    resources,
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
