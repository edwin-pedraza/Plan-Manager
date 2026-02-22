import { useEffect, useState } from 'react';
import { Language } from '@/types';

const LANGUAGE_STORAGE_KEY = 'planner-language';
const DEFAULT_LANGUAGE: Language = 'en';

const isLanguage = (value: string | null): value is Language => value === 'en' || value === 'es';

export function useLanguage() {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === 'undefined' || !window.localStorage) return DEFAULT_LANGUAGE;
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => (prev === 'en' ? 'es' : 'en'));
  };

  return { language, setLanguage, toggleLanguage };
}
