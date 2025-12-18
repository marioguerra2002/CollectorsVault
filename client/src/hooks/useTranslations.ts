'use client';
import { useLanguage } from '@/app/providers/LanguageProvider';
export function useTranslations() {
  const { messages } = useLanguage();
  const t = (key: string, defaultValue = key) => {
    const keys = key.split('.');
    let value: any = messages;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || defaultValue;
  };
  return t;
}
