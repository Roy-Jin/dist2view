import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language, translations } from './locales';

interface I18nContextType {
  locale: Language;
  setLocale: (lang: Language) => void;
  t: (key: keyof typeof translations['en'], variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Language>(() => {
    const saved = localStorage.getItem('dist_previewer_locale');
    if (saved === 'en' || saved === 'zh') {
      return saved as Language;
    }
    // Default to system browser language or Chinese
    const browserLang = navigator.language;
    return browserLang.startsWith('zh') ? 'zh' : 'en';
  });

  const setLocale = (lang: Language) => {
    setLocaleState(lang);
    localStorage.setItem('dist_previewer_locale', lang);
  };

  const t = (key: keyof typeof translations['en'], variables?: Record<string, string | number>): string => {
    const translationSet = translations[locale] || translations['en'];
    let text = translationSet[key] || translations['en'][key] || String(key);
    
    if (variables) {
      Object.entries(variables).forEach(([name, value]) => {
        text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
      });
    }
    
    return text;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
