import { FC, createContext, useContext, useEffect, useState, useMemo, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import moment, { Moment } from 'moment';
import i18n from '../i18n';

import 'moment/locale/pl';

import flagUS from '../img/flags/us.png';
import flagPL from '../img/flags/pl.png';

export class LanguageAlreadySetError extends Error {
  constructor() {
    super('Language is already set');
  }
}

export class LanguageNotFoundError extends Error {
  constructor() {
    super('Language not found');
  }
}

export interface LanguageDefinition {
  id: string;
  locale: string;
  icon: string;
  label: string;
  formatDateTime: (v: Moment, format?: string) => string;
}

export interface LanguagesContextType {
  allLanguages: Array<LanguageDefinition>;
  getLanguageById: (languageId: string) => LanguageDefinition | undefined;
  currentLanguage: LanguageDefinition;
  changeLanguage: (languageId: string) => Promise<LanguageDefinition>;
}

const LanguagesContext = createContext<LanguagesContextType>({} as LanguagesContextType);

const LanguagesProvider: FC = (props: PropsWithChildren<unknown>) => {
  const { t } = useTranslation();

  const allLanguages = useMemo<Array<LanguageDefinition>>(() => {
    return [
      { id: "en-US", locale: 'en', icon: flagUS, label: t('languages.enUS') },
      { id: "pl-PL", locale: 'pl', icon: flagPL, label: t('languages.plPL') }
    ].map(lang => {
      return {
        ...lang,
        formatDateTime: (v: Moment, format?: string): string => {
          if (!v) {
            return '-';
          }

          return v.locale(lang.locale)
            .local()
            .format(format ? format : 'LLL');
        }
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  const getLanguageById = (languageId: string): LanguageDefinition | undefined => {
    return allLanguages.find(l => l.id === languageId);
  };

  const [currentLanguage, setCurrentLanguage] = useState<LanguageDefinition>(() => getLanguageById(i18n.language) || allLanguages[0]);

  useEffect(() => {
    moment.locale(currentLanguage.locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeLanguage = (languageId: string): Promise<LanguageDefinition> => {
    if (currentLanguage.id === languageId) {
      return Promise.reject(new LanguageAlreadySetError());
    }

    const language = getLanguageById(languageId);
    if (!language) {
      return Promise.reject(new LanguageNotFoundError());
    }

    return i18n.changeLanguage(languageId)
      .then(_ => {
        moment.locale(language.locale);
        setCurrentLanguage(language);
        return language;
      });
  };

  return (
    <LanguagesContext.Provider value={{
      allLanguages,
      getLanguageById,
      currentLanguage,
      changeLanguage
    }}>
      {props.children}
    </LanguagesContext.Provider>
  );
};

export const useLanguages: (() => LanguagesContextType) = () => useContext(LanguagesContext);

export default LanguagesProvider;
