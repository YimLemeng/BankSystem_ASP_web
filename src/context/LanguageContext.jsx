import React, { createContext, useContext, useState, useCallback } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('app_language') || 'en';
    } catch {
      return 'en';
    }
  });

  const toggleLanguage = useCallback(() => {
    setLang((prev) => {
      const next = prev === 'en' ? 'km' : 'en';
      try { localStorage.setItem('app_language', next); } catch {}
      return next;
    });
  }, []);

  const setLanguage = useCallback((l) => {
    setLang(l);
    try { localStorage.setItem('app_language', l); } catch {}
  }, []);

  const t = useCallback((key) => {
    const parts = key.split('.');
    let value = translations[lang];
    for (const part of parts) {
      if (value == null) return key;
      value = value[part];
    }
    return value ?? key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, toggleLanguage, setLanguage, t, isKhmer: lang === 'km' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    
    return {
      lang: 'en',
      toggleLanguage: () => {},
      setLanguage: () => {},
      isKhmer: false,
      t: (key) => key,
    };
  }
  return ctx;
};
