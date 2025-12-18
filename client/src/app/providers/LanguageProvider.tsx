'use client';
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import en from '@/messages/en.json';
import es from '@/messages/es.json';
type Locale = 'en' | 'es';
type Messages = typeof en;
interface LanguageContextType {
  locale: Locale;
  messages: Messages;
  setLocale: (locale: Locale) => void;
}
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const messagesByLocale: Record<Locale, Messages> = { en, es };
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);
  // Cargar idioma guardado del localStorage
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale | null;
    if (savedLocale && ['en', 'es'].includes(savedLocale)) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    if (mounted) {
      localStorage.setItem('locale', newLocale);
    }
  };
  return (
    <LanguageContext.Provider value={{ locale, messages: messagesByLocale[locale], setLocale }}>
      {children}
    </LanguageContext.Provider>
  );
}
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage debe usarse dentro de LanguageProvider');
  }
  return context;
}
