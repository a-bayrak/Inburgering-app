'use client';

import { useEffect } from 'react';
import { useLanguageStore } from '@/store/useLanguageStore';
import { getDir } from '@/lib/i18n';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguageStore();

  // Apply RTL/LTR direction on every language change (PRD §12.2)
  useEffect(() => {
    const dir = getDir(language);
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  return <>{children}</>;
}
