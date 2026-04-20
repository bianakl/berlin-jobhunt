import { createContext, useContext } from 'react';
import { t as rawT } from './i18n';

export const LanguageContext = createContext({ lang: 'en', setLang: () => {} });

export function useT() {
  const { lang } = useContext(LanguageContext);
  return (key, vars) => rawT(lang, key, vars);
}
