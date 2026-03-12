'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Language } from '@/types';
import { t as translate, isRTL, getDir } from '@/lib/i18n';

interface LanguageState {
  language: Language;
  isRTL: boolean;
  dir: 'rtl' | 'ltr';
  setLanguage: (lang: Language) => void;
  t: (key: string, vars?: Record<string, string>) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      language: 'nl',
      isRTL: false,
      dir: 'ltr',

      setLanguage: (lang: Language) => {
        const rtl = isRTL(lang);
        set({ language: lang, isRTL: rtl, dir: getDir(lang) });

        // Update the HTML dir attribute for full RTL layout (PRD §12.2)
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('dir', getDir(lang));
          document.documentElement.setAttribute('lang', lang);
        }
      },

      t: (key: string, vars?: Record<string, string>) => {
        return translate(key, get().language, vars);
      },
    }),
    {
      name: 'inburgering-language',
      partialize: (state) => ({ language: state.language }),
    }
  )
);
