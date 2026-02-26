'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n';
import { Cookie, Check } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    // Avoid SSR issues and check only on client
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Delay to be less intrusive
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:slide-in-from-bottom-10 duration-500" data-state={isVisible ? 'open' : 'closed'}>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-white/10 bg-zinc-900/80 backdrop-blur-xl p-5 shadow-2xl shadow-black/30 max-w-lg">
        <div className="flex items-start gap-4">
          <Cookie className="h-8 w-8 sm:h-6 sm:w-6 text-blue-400 shrink-0 mt-1" />
          <div>
            <h4 className="font-bold text-white">{t('cookieTitle')}</h4>
            <p className="text-sm text-zinc-400 mt-1">{t('cookieDesc')}</p>
          </div>
        </div>
        <button onClick={handleAccept} className="flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-500 transition-colors">
          <Check className="h-5 w-5" />
          {t('cookieAccept')}
        </button>
      </div>
    </div>
  );
}