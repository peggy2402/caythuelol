'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { vi } from './locales/vi';
import { en } from './locales/en';
import { kr } from './locales/kr';
import { jp } from './locales/jp';
import { Language, I18nTranslationKey, LanguageContextType } from './types';
import { API_BASE_URL } from '@/lib/api';

export * from './types';

export const dictionaries = {
  vi,
  en,
  kr,
  jp,
} as const;

function getNestedValue(obj: any, path: string): string | undefined {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('vi');
  const [isDetecting, setIsDetecting] = useState(false);

  useEffect(() => {
    // 1. Kiểm tra nếu người dùng đã có tùy chọn ngôn ngữ được lưu trước đó
    const saved = localStorage.getItem('language') as Language | null;
    if (saved && (saved in dictionaries)) {
      setLanguageState(saved);
      return;
    }

    // 2. Nếu khách mới vào lần đầu (chưa lưu localStorage), tự động gọi Backend NestJS để detect IP & Geo
    let isMounted = true;
    setIsDetecting(true);

    const autoDetectGeoLocale = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/geo-locale`);
        if (res.ok) {
          const data = await res.json();
          if (
            isMounted &&
            data.suggestedLanguage &&
            (data.suggestedLanguage in dictionaries)
          ) {
            const detectedLang = data.suggestedLanguage as Language;
            setLanguageState(detectedLang);
            localStorage.setItem('language', detectedLang);
          }
        }
      } catch (err) {
        // Fallback giữ nguyên 'vi' nếu offline hoặc backend lỗi
        console.warn('GeoIP detection error, fallback to default locale (vi):', err);
      } finally {
        if (isMounted) setIsDetecting(false);
      }
    };

    autoDetectGeoLocale();

    return () => {
      isMounted = false;
    };
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: I18nTranslationKey): string => {
    const currentDict = dictionaries[language] as any;
    const fallbackDict = dictionaries.vi as any;
    const value = getNestedValue(currentDict, key) ?? getNestedValue(fallbackDict, key);

    return typeof value === 'string' ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isDetecting }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider');
  }
  return context;
}
