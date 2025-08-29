'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import { Language, defaultLanguage, getTranslation } from '@/config/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

interface LanguageProviderProps {
  children: React.ReactNode;
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useLocalStorageState<Language>('language', defaultLanguage);

  // Detect browser language on first load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const browserLang = navigator.language.split('-')[0] as Language;
      if ((browserLang === 'de' || browserLang === 'en') && !localStorage.getItem('language')) {
        setLanguageState(browserLang);
      }
    }
  }, [setLanguageState]);

  const setLanguage = useCallback((newLanguage: Language) => {
    setLanguageState(newLanguage);
    // Update document language for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLanguage;
    }
  }, [setLanguageState]);

  const t = useCallback((key: string): string => {
    return getTranslation(language, key);
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}
